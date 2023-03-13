import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'stream',
})
export class StreamPipe implements PipeTransform {
    transform(value: (number | number[])[], index: number): (number | number[])[] {
        return value.map((a) => [a[0], a[1][index]]);
    }
}
