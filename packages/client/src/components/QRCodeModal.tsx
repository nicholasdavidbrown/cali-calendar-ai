import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './QRCodeModal.css';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  joinUrl: string;
  code: string;
}

function QRCodeModal({ isOpen, onClose, joinUrl, code }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="qr-modal-close" onClick={onClose}>
          ×
        </button>

        <h2>Family Invite</h2>
        <p className="qr-modal-description">
          Scan this QR code or share the link below with your family member
        </p>

        <div className="qr-code-container">
          <QRCodeSVG value={joinUrl} size={256} level="H" includeMargin={true} />
        </div>

        <div className="join-info">
          <div className="info-section">
            <label>Join Code</label>
            <div className="code-display">
              <span className="code-value">{code}</span>
              <button onClick={handleCopyCode} className="copy-btn">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="info-section">
            <label>Join Link</label>
            <div className="link-display">
              <input type="text" value={joinUrl} readOnly className="link-input" />
              <button onClick={handleCopyLink} className="copy-btn">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <div className="qr-modal-footer">
          <p className="expire-note">This invite expires in 24 hours</p>
        </div>
      </div>
    </div>
  );
}

export default QRCodeModal;
