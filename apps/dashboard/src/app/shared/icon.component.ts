import {
  Component,
  computed,
  inject,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Icons } from './icons';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (html(); as svgHtml) {
    <span
      [innerHTML]="svgHtml"
      class="inline-block"
      [class]="sizeClass()"
    ></span>
  }`,
})
export class IconComponent {
  private sanitizer = inject(DomSanitizer);

  name = input<keyof typeof Icons>('tasks');
  size = input<'sm' | 'md' | 'lg'>('md');

  html = computed(() => {
    const svg = Icons[this.name()] ?? '';
    return svg ? this.sanitizer.bypassSecurityTrustHtml(svg) : null;
  });

  sizeClass = computed(() => {
    const map = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
    return map[this.size()];
  });
}
