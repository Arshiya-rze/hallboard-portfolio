import { Component } from '@angular/core';
import {MatProgressBarModule} from '@angular/material/progress-bar';

@Component({
  selector: 'app-ui-loading-progress-bar',
  imports: [MatProgressBarModule],
  templateUrl: './ui-loading-progress-bar.html',
  styleUrl: './ui-loading-progress-bar.scss',
})
export class UiLoadingProgressBar {}
