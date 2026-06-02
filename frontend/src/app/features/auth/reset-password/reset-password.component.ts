import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const matchPasswordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ passwordsNotMatching: true });
    return { passwordsNotMatching: true };
  }
  return null;
};

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  isSubmitting = signal(false);
  hasError = signal(false);
  errorMessage = signal('');
  isSuccess = signal(false);

  form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.pattern(passwordPattern)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: matchPasswordValidator });

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) {
      this.errorMessage.set('Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu mã xác thực (token).');
    }
  }

  submit() {
    if (!this.token) {
      this.triggerError('Mã xác thực không tìm thấy. Không thể đặt lại mật khẩu.');
      return;
    }

    if (this.form.invalid) {
      this.triggerError('Vui lòng kiểm tra lại thông tin mật khẩu nhập vào.');
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');

    const { password } = this.form.getRawValue();

    this.authService.resetPassword({
      token: this.token,
      newPassword: password
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isSuccess.set(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.triggerError(err.error?.message || 'Liên kết đã hết hạn hoặc mã xác thực không đúng.');
      }
    });
  }

  private triggerError(message: string) {
    this.hasError.set(true);
    this.errorMessage.set(message);
    setTimeout(() => this.hasError.set(false), 600);
  }
}
