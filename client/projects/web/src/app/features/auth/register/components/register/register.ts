import { Component, inject } from '@angular/core';
import {
  Validators,
  AbstractControlOptions,
  FormBuilder,
  ReactiveFormsModule,
  FormsModule,
  FormControl,
} from '@angular/forms';
import { PasswordsValidators } from '../../../../../shared/validators/passwords-validators';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatInputModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private fb = inject(FormBuilder);
  private readonly _passwordPattern: RegExp = /^(?=.*[A-Z]).*$/;
  private readonly _EmailPattern: RegExp = /^([\w.-]+)@([\w-]+)((\.(\w){2,5})+)$/;

  registerFg = this.fb.group(
    {
      emailCtrl: [
        '',
        [
          Validators.required,
          Validators.maxLength(50),
          Validators.pattern(this._EmailPattern),
        ],
      ],
      passwordCtrl: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20),
          Validators.pattern(this._passwordPattern),
        ],
      ],
      confirmPasswordCtrl: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20),
          Validators.pattern(this._passwordPattern),
        ],
      ],
    },
    { validators: [PasswordsValidators.matchPasswords] } as AbstractControlOptions,
  );

  get EmailCtrl(): FormControl {
    return this.registerFg.get('emailCtrl') as FormControl;
  }
  get PasswordCtrl(): FormControl {
    return this.registerFg.get('passwordCtrl') as FormControl;
  }
  get ConfirmPasswordCtrl(): FormControl {
    return this.registerFg.get('confirmPasswordCtrl') as FormControl;
  }

  register(): void {
    // Some code
  }
}
