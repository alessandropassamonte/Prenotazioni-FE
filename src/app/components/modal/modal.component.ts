import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalOptions, ModalType } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
  @Input() options!: ModalOptions;

  ModalType = ModalType;

  constructor(public activeModal: NgbActiveModal) {}

  get isConfirmModal(): boolean {
    return this.options.type === ModalType.CONFIRM;
  }

  onConfirm(): void {
    this.activeModal.close(true);
  }

  onCancel(): void {
    this.activeModal.dismiss(false);
  }

  onClose(): void {
    this.activeModal.close();
  }
}

