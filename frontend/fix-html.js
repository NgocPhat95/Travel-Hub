const fs = require('fs');

const appHtml = `<div class="min-h-screen bg-slate-900 font-sans text-slate-100 flex flex-col">
  <!-- Navbar Glassmorphism -->
  <nav class="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-900/60 backdrop-blur-md">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
      <a routerLink="/" class="text-2xl font-bold tracking-tighter text-white">
        Travel<span class="text-[#01FCEF]">Hub</span>
      </a>

      <div class="flex items-center gap-4">
        <a routerLink="/profile" class="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200">Test Profile</a>
        
        <button
          (click)="showAuthModal = true"
          class="rounded-full bg-gradient-to-r from-indigo-500 to-[#01FCEF] px-5 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(1,252,239,0.3)] transition-transform hover:scale-105"
        >
          Đăng nhập
        </button>
      </div>
    </div>
  </nav>

  <!-- Main Content Area -->
  <main class="flex-1 w-full bg-slate-900 relative">
    <router-outlet></router-outlet>
  </main>
</div>

<!-- Modal Component -->
@if (showAuthModal) {
  <app-auth-modal (close)="showAuthModal = false"></app-auth-modal>
}`;

const profileHtml = `<div class="relative min-h-screen bg-cover bg-center bg-no-repeat" 
     style="background-image: url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80');">
  <!-- Lớp phủ tối mờ gradient -->
  <div class="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-slate-900/90 backdrop-blur-[2px]"></div>

  <div class="relative z-10 mx-auto flex max-w-4xl flex-col items-center justify-center p-8 pt-32">
    <!-- Thẻ Card Glassmorphism Siêu Kính -->
    <div class="w-full rounded-[2rem] border border-white/20 bg-white/10 p-8 shadow-[0_20px_50px_rgba(8,112,184,0.15)] backdrop-blur-xl md:p-12">
      
      <!-- Box Avatar & Thông tin cơ bản -->
      <div class="flex flex-col items-center gap-6 md:flex-row md:items-start">
        <!-- Avatar Wrapper -->
        <div class="relative group">
          <div class="h-32 w-32 overflow-hidden rounded-full border-4 border-white/30 shadow-[0_0_25px_rgba(1,252,239,0.3)] transition-transform duration-300 group-hover:scale-105">
            <img *ngIf="avatarPreview()" [src]="avatarPreview()!" alt="Avatar" class="h-full w-full object-cover">
            <div *ngIf="!avatarPreview()" class="flex h-full w-full items-center justify-center bg-slate-800 text-2xl font-semibold text-slate-300">
              {{ user()?.fullName?.charAt(0) || 'U' }}
            </div>
          </div>
          <label class="absolute bottom-0 right-0 cursor-pointer rounded-full bg-cyan-400 p-2 text-white shadow-lg transition-transform hover:scale-110">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <input type="file" class="hidden" accept="image/*" (change)="onAvatarSelected($event)" />
          </label>
        </div>

        <div class="flex-1 space-y-3 text-center md:text-left">
          <div class="flex items-center justify-center gap-3 md:justify-start">
            <h1 class="text-4xl font-bold tracking-tight text-white drop-shadow-md">{{ user()?.fullName || 'Travel Hub User' }}</h1>
            <span class="rounded-full bg-cyan-400/20 border border-cyan-400/50 px-3 py-1 text-xs font-semibold text-cyan-200">
              Cấp độ {{ level() }}
            </span>
          </div>
          <p class="text-sm font-medium text-slate-300">{{ user()?.email }}</p>
          <p class="text-slate-100 max-w-lg">{{ user()?.bio || 'Chưa có thông tin tiểu sử.' }}</p>
        </div>
      </div>

      <!-- Thanh kinh nghiệm (XP Bar) -->
      <div class="mt-10 rounded-2xl bg-slate-900/40 p-6 border border-white/10">
        <div class="flex justify-between mb-2">
          <span class="text-sm font-medium text-cyan-400">Tiến trình XP: {{ xp() }} / {{ nextLevelXp() }}</span>
          <span class="text-sm font-medium text-slate-300">Level {{ level() + 1 }}</span>
        </div>
        <div class="h-3 w-full rounded-full bg-slate-800/80 overflow-hidden border border-white/5 shadow-inner">
          <div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-[#01FCEF] shadow-[0_0_15px_rgba(1,252,239,0.7)] transition-all duration-1000 ease-out"
               [style.width.%]="xpProgress()"></div>
        </div>
      </div>

      <!-- Form Cập nhật -->
      <div class="mt-8 border-t border-white/20 pt-8">
        <h3 class="font-semibold text-white mb-4 text-xl">Cập nhật hồ sơ</h3>
        <form class="space-y-5" [formGroup]="form" (ngSubmit)="saveProfile()">
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-300">Họ và tên</label>
            <input type="text" formControlName="fullName"
                   class="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white shadow-inner outline-none transition focus:border-cyan-300 focus:bg-white/10" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-300">Giới thiệu</label>
            <textarea rows="4" formControlName="bio"
                      class="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white shadow-inner outline-none transition focus:border-cyan-300 focus:bg-white/10"
                      placeholder="Chia sẻ đôi nét về bạn..."></textarea>
          </div>

          <p *ngIf="errorMessage()" class="text-sm text-rose-400">{{ errorMessage() }}</p>

          <div class="flex justify-end gap-4 mt-6">
            <button type="submit" [disabled]="isSaving()"
                    class="rounded-xl bg-gradient-to-r from-indigo-600 to-[#01FCEF] px-8 py-3 font-semibold text-white shadow-[0_10px_25px_rgba(1,252,239,0.4)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
              {{ isSaving() ? 'Đang lưu...' : 'Lưu thay đổi' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>`;

fs.writeFileSync('src/app/app.component.html', appHtml, 'utf8');
fs.writeFileSync('src/app/features/profile/profile/profile.component.html', profileHtml, 'utf8');
console.log("Fixed HTML files successfully!");