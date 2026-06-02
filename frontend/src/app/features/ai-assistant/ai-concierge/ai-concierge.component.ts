import { Component, ElementRef, ViewChild, inject, signal, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, ChatMessage } from '../../../core/services/ai.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-ai-concierge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-concierge.component.html',
  styleUrl: './ai-concierge.component.scss',
})
export class AiConciergeComponent implements AfterViewChecked {
  private readonly aiService = inject(AiService);
  private readonly authService = inject(AuthService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = signal(false);
  isLoading = signal(false);
  messageText = '';
  
  isAuthenticated = this.authService.isAuthenticated;
  user = this.authService.user;

  messages = signal<ChatMessage[]>([
    {
      role: 'model',
      parts: 'Xin chào! Tôi là AI Concierge, trợ lý du lịch cá nhân của bạn. Tôi có thể giúp gì cho bạn hôm nay?',
    },
  ]);

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen.update((v) => !v);
  }

  sendMessage() {
    const text = this.messageText.trim();
    if (!text || this.isLoading()) return;

    // Add user message
    const currentMessages = this.messages();
    const updatedMessages = [...currentMessages, { role: 'user', parts: text } as ChatMessage];
    this.messages.set(updatedMessages);
    this.messageText = '';
    this.isLoading.set(true);

    // Call service (passing up to last 10 messages for context window)
    const history = updatedMessages.slice(0, -1);
    this.aiService.chat(text, history).subscribe({
      next: (response) => {
        this.messages.update((msgs) => [...msgs, { role: 'model', parts: response } as ChatMessage]);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Chat error:', err);
        this.messages.update((msgs) => [
          ...msgs,
          {
            role: 'model',
            parts: 'Xin lỗi, đã xảy ra sự cố khi kết nối với máy chủ AI. Bạn hãy thử lại sau.',
          } as ChatMessage,
        ]);
        this.isLoading.set(false);
      },
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }
}
