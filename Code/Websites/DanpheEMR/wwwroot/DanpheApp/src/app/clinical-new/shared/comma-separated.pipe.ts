// truncate.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'CommaSeparated'
})
export class CommaSeparatedPipe implements PipeTransform {

  transform(value: string[]): string {
    if (!Array.isArray(value)) {
      return value;
    }
    return value.join(', ');
  }
}