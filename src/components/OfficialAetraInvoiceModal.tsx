import React from 'react';
import { IndustryCustomer } from '../types';
import { AetraOfficialPdfInvoice } from './AetraOfficialPdfInvoice';

interface OfficialAetraInvoiceModalProps {
  customer: IndustryCustomer;
  onClose: () => void;
}

export const OfficialAetraInvoiceModal: React.FC<OfficialAetraInvoiceModalProps> = ({
  customer,
  onClose
}) => {
  return <AetraOfficialPdfInvoice customer={customer} onClose={onClose} />;
};
