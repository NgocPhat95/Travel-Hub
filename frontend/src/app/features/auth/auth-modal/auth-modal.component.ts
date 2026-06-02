import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.scss',
})
export class AuthModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  mode = signal<'login' | 'register' | 'forgot'>('login');
  isSubmitting = signal(false);
  hasError = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  isLoginMode = computed(() => this.mode() === 'login');
  isRegisterMode = computed(() => this.mode() === 'register');
  isForgotMode = computed(() => this.mode() === 'forgot');

  form = this.fb.nonNullable.group({
    fullName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
  ) {}

  setMode(newMode: 'login' | 'register' | 'forgot') {
    this.mode.set(newMode);

    const fullNameControl = this.form.controls.fullName;
    const passwordControl = this.form.controls.password;

    if (newMode === 'register') {
      fullNameControl.setValidators([Validators.required, Validators.minLength(2)]);
      passwordControl.setValidators([Validators.required, Validators.pattern(passwordPattern)]);
    } else if (newMode === 'login') {
      fullNameControl.clearValidators();
      passwordControl.setValidators([Validators.required]);
    } else { // forgot
      fullNameControl.clearValidators();
      passwordControl.clearValidators();
    }

    fullNameControl.updateValueAndValidity();
    passwordControl.updateValueAndValidity();

    this.hasError.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  submit() {
    if (this.form.invalid) {
      this.triggerError('Vui lòng kiểm tra lại các thông tin đã nhập.');
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');

    const { fullName, email, password } = this.form.getRawValue();

    if (this.mode() === 'forgot') {
      this.authService.forgotPassword({ email }).subscribe({
        next: (resp) => {
          this.isSubmitting.set(false);
          this.successMessage.set(resp.message || 'Nếu email của bạn tồn tại trong hệ thống, một liên kết đặt lại mật khẩu đã được gửi.');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.triggerError(err.error?.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.');
        },
      });
      return;
    }

    const request$ = this.mode() === 'login'
      ? this.authService.login({ email, password })
      : this.authService.register({
          fullName: fullName || 'Travel Hub User',
          email,
          password,
        });

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.success.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.triggerError(err.error?.message || 'Có lỗi xảy ra trong quá trình xử lý.');
      },
    });
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }

  private triggerError(message: string) {
    this.hasError.set(true);
    this.errorMessage.set(message);
    setTimeout(() => this.hasError.set(false), 600);
  }
}

