import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './confirm.html',
  styleUrl: './confirm.scss',
})
export class Confirm {}
