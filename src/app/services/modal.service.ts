import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

export enum ModalType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  CONFIRM = 'confirm'
}

export interface ModalOptions {
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalRef?: NgbModalRef;

  constructor(private ngbModal: NgbModal) {}

  /**
   * Mostra un modale di successo
   */
  showSuccess(message: string, title: string = 'Operazione completata'): Promise<void> {
    return this.showMessage({
      title,
      message,
      type: ModalType.SUCCESS,
      icon: 'bi-check-circle-fill text-success'
    });
  }

  /**
   * Mostra un modale di errore
   */
  showError(message: string, title: string = 'Errore'): Promise<void> {
    return this.showMessage({
      title,
      message,
      type: ModalType.ERROR,
      icon: 'bi-x-circle-fill text-danger'
    });
  }

  /**
   * Mostra un modale di avviso
   */
  showWarning(message: string, title: string = 'Attenzione'): Promise<void> {
    return this.showMessage({
      title,
      message,
      type: ModalType.WARNING,
      icon: 'bi-exclamation-triangle-fill text-warning'
    });
  }

  /**
   * Mostra un modale informativo
   */
  showInfo(message: string, title: string = 'Informazione'): Promise<void> {
    return this.showMessage({
      title,
      message,
      type: ModalType.INFO,
      icon: 'bi-info-circle-fill text-info'
    });
  }

  /**
   * Mostra un modale di conferma
   */
  async showConfirm(
    message: string,
    title: string = 'Conferma',
    confirmText: string = 'Conferma',
    cancelText: string = 'Annulla'
  ): Promise<boolean> {
    const { ModalComponent } = await import('../components/modal/modal.component');

    this.modalRef = this.ngbModal.open(ModalComponent, {
      centered: true,
      backdrop: 'static'
    });

    this.modalRef.componentInstance.options = {
      title,
      message,
      type: ModalType.CONFIRM,
      icon: 'bi-question-circle-fill text-primary',
      confirmText,
      cancelText
    };

    try {
      const result = await this.modalRef.result;
      return result === true;
    } catch {
      return false;
    }
  }

  /**
   * Mostra un modale generico
   */
  private async showMessage(options: ModalOptions): Promise<void> {
    const { ModalComponent } = await import('../components/modal/modal.component');

    this.modalRef = this.ngbModal.open(ModalComponent, {
      centered: true
    });

    this.modalRef.componentInstance.options = {
      confirmText: 'OK',
      ...options
    };

    try {
      await this.modalRef.result;
    } catch {
      // Modal dismissed
    }
  }

  /**
   * Chiude il modale corrente
   */
  close(): void {
    this.modalRef?.close();
  }
}
