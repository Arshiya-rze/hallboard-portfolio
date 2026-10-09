import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortenStringPipe',
})
export class ShortenStringPipe implements PipeTransform {
  transform(value: string | undefined, limit?: number | undefined): string | null {
    return !value
      ? null
      : limit
        ? value.substring(0, limit)
        : value.substring(0, 100); // set 50 for website URL lengths
  }
}
