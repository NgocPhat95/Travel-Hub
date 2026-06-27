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
    this.form.reset();

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

  // Lấy lỗi cụ thể của từng trường bằng tiếng Việt
  getFieldError(field: 'fullName' | 'email' | 'password'): string {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';

    const errors = control.errors;
    if (field === 'fullName') {
      if (errors['required']) return '⚠ Vui lòng nhập họ và tên.';
      if (errors['minlength']) return '⚠ Họ và tên phải có ít nhất 2 ký tự.';
    }
    if (field === 'email') {
      if (errors['required']) return '⚠ Vui lòng nhập địa chỉ email.';
      if (errors['email']) return '⚠ Email không đúng định dạng (vd: name@gmail.com).';
    }
    if (field === 'password') {
      if (errors['required']) return '⚠ Vui lòng nhập mật khẩu.';
      if (errors['pattern']) return '⚠ Mật khẩu phải có ít nhất 8 ký tự, gồm chữ HOA, chữ thường và số.';
    }
    return '';
  }

  // Dịch lỗi từ server sang tiếng Việt
  private translateServerError(err: any): string {
    const raw: string = err?.error?.message || err?.message || '';
    const msg = Array.isArray(raw) ? raw.join(', ') : String(raw);
    const lower = msg.toLowerCase();

    if (lower.includes('email already exists') || lower.includes('conflict')) {
      return '❌ Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.';
    }
    if (lower.includes('invalid credentials') || lower.includes('unauthorized')) {
      return '❌ Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.';
    }
    if (lower.includes('email is not verified')) {
      return '❌ Email chưa được xác thực. Vui lòng kiểm tra hộp thư để xác thực tài khoản.';
    }
    if (lower.includes('banned')) {
      return '❌ Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.';
    }
    if (lower.includes('password must be') || lower.includes('matches')) {
      return '❌ Mật khẩu phải có ít nhất 8 ký tự, gồm chữ HOA, chữ thường và số.';
    }
    if (lower.includes('full name') || lower.includes('fullname')) {
      return '❌ Họ và tên phải có ít nhất 2 ký tự.';
    }
    if (lower.includes('email is not valid') || lower.includes('email must be')) {
      return '❌ Email không đúng định dạng.';
    }
    if (lower.includes('econnrefused') || lower.includes('unknown error') || lower.includes('0 undefined')) {
      return '❌ Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
    }
    if (msg) return `❌ ${msg}`;
    return '❌ Có lỗi xảy ra. Vui lòng thử lại.';
  }

  submit() {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.triggerError('Vui lòng kiểm tra lại thông tin đã nhập.');
      return;
    }

    this.isSubmitting.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');

    const { fullName, email, password } = this.form.getRawValue();

    if (this.mode() === 'forgot') {
      this.authService.forgotPassword({ email }).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set('✅ Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.triggerError(this.translateServerError(err));
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
        this.triggerError(this.translateServerError(err));
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
