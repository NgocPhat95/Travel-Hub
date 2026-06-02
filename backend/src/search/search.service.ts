import { Injectable, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly indexName = 'places';

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    try {
      const indexExists = await this.elasticsearchService.indices.exists({
        index: this.indexName,
      });

      if (!indexExists) {
        console.log(`Creating Elasticsearch index: ${this.indexName}`);
        await this.elasticsearchService.indices.create({
          index: this.indexName,
          settings: {
            analysis: {
              analyzer: {
                autocomplete_analyzer: {
                  type: 'custom',
                  tokenizer: 'autocomplete_tokenizer',
                  filter: ['lowercase'],
                },
              },
              tokenizer: {
                autocomplete_tokenizer: {
                  type: 'edge_ngram',
                  min_gram: 1,
                  max_gram: 20,
                  token_chars: ['letter', 'digit'],
                },
              },
            },
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              name: {
                type: 'text',
                fields: {
                  autocomplete: {
                    type: 'text',
                    analyzer: 'autocomplete_analyzer',
                    search_analyzer: 'standard',
                  },
                },
              },
              description: { type: 'text' },
              category: { type: 'keyword' },
              address: {
                type: 'text',
                fields: {
                  autocomplete: {
                    type: 'text',
                    analyzer: 'autocomplete_analyzer',
                    search_analyzer: 'standard',
                  },
                },
              },
              location: { type: 'geo_point' },
              priceMin: { type: 'double' },
              priceMax: { type: 'double' },
              avgRating: { type: 'double' },
              amenities: { type: 'keyword' },
              status: { type: 'keyword' },
              avatarUrl: { type: 'keyword' },
              isTravelersChoice: { type: 'boolean' },
            },
          },
        });
      }

      // Synchronize database to Elasticsearch on startup
      await this.syncPlacesToElasticsearch();
    } catch (error) {
      console.error('Error initializing Elasticsearch index:', error);
    }
  }

  async syncPlacesToElasticsearch() {
    console.log('Synchronizing Places database to Elasticsearch...');
    const places = await this.prisma.place.findMany({
      include: {
        _count: {
          select: { reviews: true },
        },
      },
    });
    
    for (const place of places) {
      const isTravelersChoice = place.ratingAverage >= 4.5 && place._count.reviews >= 3;
      await this.elasticsearchService.index({
        index: this.indexName,
        id: place.id,
        document: {
          id: place.id,
          name: place.name,
          description: place.description,
          category: place.category,
          address: place.address,
          location: {
            lat: place.latitude,
            lon: place.longitude,
          },
          priceMin: place.priceMin,
          priceMax: place.priceMax,
          avgRating: place.avgRating,
          amenities: place.amenities,
          status: place.status,
          avatarUrl: place.avatarUrl,
          isTravelersChoice,
        },
      });
    }
    console.log(`Synchronized ${places.length} places to Elasticsearch.`);
  }

  async syncPlaceToElasticsearch(placeId: string) {
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
      include: {
        _count: {
          select: { reviews: true },
        },
      },
    });
    if (place) {
      const isTravelersChoice = place.ratingAverage >= 4.5 && place._count.reviews >= 3;
      await this.elasticsearchService.index({
        index: this.indexName,
        id: place.id,
        document: {
          id: place.id,
          name: place.name,
          description: place.description,
          category: place.category,
          address: place.address,
          location: {
            lat: place.latitude,
            lon: place.longitude,
          },
          priceMin: place.priceMin,
          priceMax: place.priceMax,
          avgRating: place.avgRating,
          amenities: place.amenities,
          status: place.status,
          avatarUrl: place.avatarUrl,
          isTravelersChoice,
        },
      });
      console.log(`Updated place ${placeId} in Elasticsearch index.`);
    }
  }

  async deletePlaceFromElasticsearch(placeId: string) {
    try {
      await this.elasticsearchService.delete({
        index: this.indexName,
        id: placeId,
      });
      console.log(`Deleted place ${placeId} from Elasticsearch index.`);
    } catch (e) {
      console.error(`Failed to delete place ${placeId} from Elasticsearch:`, e);
    }
  }

  async autocomplete(query: string, category?: string) {
    if (!query) {
      return [];
    }

    const filter: any[] = [{ term: { status: 'ACTIVE' } }];
    if (category) {
      filter.push({ term: { category } });
    }

    const result = await this.elasticsearchService.search({
      index: this.indexName,
      size: 5,
      query: {
        bool: {
          should: [
            {
              match_phrase_prefix: {
                name: {
                  query,
                  boost: 3,
                },
              },
            },
            {
              match: {
                'name.autocomplete': {
                  query,
                  fuzziness: 'AUTO',
                },
              },
            },
            {
              match_phrase_prefix: {
                address: {
                  query,
                  boost: 1.5,
                },
              },
            },
          ],
          minimum_should_match: 1,
          filter,
        },
      },
    });

    const hits = result.hits.hits;
    return hits.map((hit: any) => hit._source);
  }

  async searchPlaces(filters: {
    lat?: number;
    lon?: number;
    radius?: number; // in km
    nelat?: number;
    nelon?: number;
    swlat?: number;
    swlon?: number;
    priceMin?: number;
    priceMax?: number;
    rating?: number;
    amenities?: string[];
    category?: string;
    status?: string;
  }) {
    const must: any[] = [];
    const filter: any[] = [];

    // Category filter
    if (filters.category) {
      filter.push({ term: { category: filters.category } });
    }

    // Status filter (default ACTIVE)
    filter.push({ term: { status: filters.status || 'ACTIVE' } });

    // Price filters
    if (filters.priceMin !== undefined) {
      filter.push({
        range: {
          priceMax: { gte: filters.priceMin },
        },
      });
    }
    if (filters.priceMax !== undefined) {
      filter.push({
        range: {
          priceMin: { lte: filters.priceMax },
        },
      });
    }

    // Rating filters
    if (filters.rating !== undefined) {
      filter.push({
        range: {
          avgRating: { gte: filters.rating },
        },
      });
    }

    // Amenities filters
    if (filters.amenities && filters.amenities.length > 0) {
      filters.amenities.forEach((amenity) => {
        filter.push({ term: { amenities: amenity } });
      });
    }

    // Geospatial search: Bounding Box (Map drag/zoom)
    if (
      filters.nelat !== undefined &&
      filters.nelon !== undefined &&
      filters.swlat !== undefined &&
      filters.swlon !== undefined
    ) {
      filter.push({
        geo_bounding_box: {
          location: {
            top_left: {
              lat: filters.nelat,
              lon: filters.swlon,
            },
            bottom_right: {
              lat: filters.swlat,
              lon: filters.nelon,
            },
          },
        },
      });
    }
    // Geospatial search: Circle radius distance (from specific location)
    else if (
      filters.lat !== undefined &&
      filters.lon !== undefined &&
      filters.radius !== undefined
    ) {
      filter.push({
        geo_distance: {
          distance: `${filters.radius}km`,
          location: {
            lat: filters.lat,
            lon: filters.lon,
          },
        },
      });
    }

    const queryBody: any = {
      index: this.indexName,
      size: 50,
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter,
        },
      },
    };

    // Sort by geo distance if lat and lon are provided (when bounding box is not used)
    if (filters.lat !== undefined && filters.lon !== undefined && filters.nelat === undefined) {
      queryBody.sort = [
        {
          _geo_distance: {
            location: {
              lat: filters.lat,
              lon: filters.lon,
            },
            order: 'asc',
            unit: 'km',
            distance_type: 'arc',
            mode: 'min',
          },
        },
      ];
    }

    const result = await this.elasticsearchService.search(queryBody);

    return result.hits.hits.map((hit: any) => {
      const source = hit._source;
      const distance = hit.sort && hit.sort[0] !== undefined ? hit.sort[0] : null;
      return {
        ...source,
        distance: distance !== null ? Number(distance.toFixed(2)) : null,
      };
    });
  }
}
