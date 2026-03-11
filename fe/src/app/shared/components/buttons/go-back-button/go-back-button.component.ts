import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapArrowLeft } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-go-back-button',
  imports: [NgIconComponent],
  viewProviders: [
    provideIcons({
      bootstrapArrowLeft,
    }),
  ],
  templateUrl: './go-back-button.component.html',
})
export class GoBackButtonComponent {
  private location = inject(Location);

  goBack() {
    this.location.back();
  }
}
