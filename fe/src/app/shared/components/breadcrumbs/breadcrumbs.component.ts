import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapChevronRight, bootstrapHouseDoor } from '@ng-icons/bootstrap-icons';

export interface BreadcrumbStep {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-breadcrumbs',
  imports: [RouterLink, NgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      bootstrapChevronRight,
      bootstrapHouseDoor,
    }),
  ],
  templateUrl: './breadcrumbs.component.html',
})
export class BreadcrumbsComponent {
  steps = input.required<BreadcrumbStep[]>();
}
