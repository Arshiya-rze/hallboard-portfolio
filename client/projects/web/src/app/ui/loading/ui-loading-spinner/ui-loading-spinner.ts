import { Component } from '@angular/core';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-ui-loading-spinner',
  imports: [MatProgressSpinnerModule],
  templateUrl: './ui-loading-spinner.html',
  styleUrl: './ui-loading-spinner.scss',
})
export class UiLoadingSpinner {}
