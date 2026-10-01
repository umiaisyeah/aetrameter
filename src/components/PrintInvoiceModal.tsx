import React from 'react';
import { IndustryCustomer } from '../types';
import { AetraOfficialPdfInvoice } from './AetraOfficialPdfInvoice';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: IndustryCustomer | null;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  if (!isOpen || !customer) return null;

  return <AetraOfficialPdfInvoice customer={customer} onClose={onClose} />;
};
