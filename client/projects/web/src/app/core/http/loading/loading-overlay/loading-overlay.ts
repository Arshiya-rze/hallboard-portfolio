import { Component, inject } from '@angular/core';
import { LoadingService } from '../services/loading-service';

@Component({
  selector: 'app-loading-overlay',
  imports: [],
  templateUrl: './loading-overlay.html',
  styleUrl: './loading-overlay.scss',
})
export class LoadingOverlay {
  protected readonly loadingService = inject(LoadingService);
}
