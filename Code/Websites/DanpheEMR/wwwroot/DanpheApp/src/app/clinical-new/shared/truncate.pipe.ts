// truncate.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {

  transform(value: string, limit: number = 100, trail: string = '...'): string {
    if (value && value.length) {
      return value.length > limit ? value.substring(0, limit) + trail : value;
    }
    else {
      return value;
    }
  }

}
