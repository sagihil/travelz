// components/Modal/Modal.jsx
// --------------------------
// Purpose: Generic modal overlay used for create/edit forms on the Dashboard.
//
// Props:
//   isOpen   {boolean}  – Controls visibility; renders nothing when false.
//   title    {string}   – Text shown in the modal header.
//   onClose  {function} – Called when the user clicks the ✕ button.
//   children {ReactNode} – The form (or any content) to render inside the modal.
//
// Accessibility:
//   role="dialog" + aria-modal="true" signal to screen readers that a dialog is open.
//   aria-labelledby connects the heading to the dialog role.
//   Clicking the backdrop does NOT close the modal so the user cannot accidentally
//   lose form input by missing the ✕ button.

import React from 'react';
import './Modal.css';

function Modal({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-box">
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
