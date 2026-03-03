/**
 * BarcodeScanner — Camera-based barcode scanning for food products.
 *
 * Uses html5-qrcode to access the device camera and decode EAN-13, EAN-8,
 * UPC-A barcodes and QR codes. On successful scan, queries Open Food Facts
 * for nutrition data.
 *
 * States: idle → scanning → found → loading → result → error
 *
 * @see openFoodFactsBarcode.ts for API integration
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  X, Loader2, Check, AlertCircle, RefreshCw, ScanBarcode,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { lookupBarcode, type BarcodeProduct } from '../../../services/openFoodFactsBarcode';

// ── Types ────────────────────────────────────────────────────────────

type ScannerState = 'idle' | 'scanning' | 'found' | 'loading' | 'result' | 'error';

export interface BarcodeScanResult {
  product: BarcodeProduct;
  /** Whether the product was found in user_products DB (pre-existing) */
  fromUserProducts: boolean;
}

interface BarcodeScannerProps {
  /** Called when user accepts a scanned product */
  onAccept: (result: BarcodeScanResult) => void;
  /** Called when user closes the scanner */
  onClose: () => void;
  /** Optional: check user_products for existing barcode match */
  onLookupUserProduct?: (barcode: string) => BarcodeProduct | null;
}

// ── Supported barcode formats ────────────────────────────────────────

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.QR_CODE,
];

// Scanner container ID (must be unique in DOM)
const SCANNER_CONTAINER_ID = 'barcode-scanner-container';

// ── Component ────────────────────────────────────────────────────────

export function BarcodeScanner({ onAccept, onClose, onLookupUserProduct }: BarcodeScannerProps) {
  const { t, language } = useTranslation();
  const meals = t.meals as Record<string, string>;

  const [state, setState] = useState<ScannerState>('idle');
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [fromUserProducts, setFromUserProducts] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);

  // ── Stop Scanner ─────────────────────────────────────────────────

  const stopScanner = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      const scanner = scannerRef.current;
      if (scanner) {
        const scanState = scanner.getState();
        // State 2 = SCANNING, State 3 = PAUSED
        if (scanState === 2 || scanState === 3) {
          await scanner.stop();
        }
        scanner.clear();
        scannerRef.current = null;
      }
    } catch {
      // Ignore stop errors (camera may already be released)
    } finally {
      isStoppingRef.current = false;
    }
  }, []);

  // ── Cleanup on unmount ───────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // ── Start Scanning ───────────────────────────────────────────────

  const startScanning = useCallback(async () => {
    setState('scanning');
    setErrorMessage('');
    setProduct(null);
    setScannedBarcode('');

    try {
      // Ensure previous scanner is stopped
      await stopScanner();

      const html5Qrcode = new Html5Qrcode(SCANNER_CONTAINER_ID, {
        formatsToSupport: SUPPORTED_FORMATS,
        verbose: false,
      });
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          aspectRatio: 1.5,
        },
        // Success callback
        async (decodedText) => {
          // Stop scanning immediately after first hit
          setScannedBarcode(decodedText);
          setState('found');

          try {
            await html5Qrcode.stop();
          } catch {
            // Ignore
          }

          // Look up product
          setState('loading');

          // First: check user products
          if (onLookupUserProduct) {
            const userProduct = onLookupUserProduct(decodedText);
            if (userProduct) {
              setProduct(userProduct);
              setFromUserProducts(true);
              setState('result');
              return;
            }
          }

          // Second: query Open Food Facts
          try {
            const offProduct = await lookupBarcode(decodedText);
            if (offProduct) {
              setProduct(offProduct);
              setFromUserProducts(false);
              setState('result');
            } else {
              setErrorMessage(
                meals.barcodeNotFound ||
                (language === 'de'
                  ? 'Produkt nicht in der Datenbank gefunden'
                  : 'Product not found in database')
              );
              setState('error');
            }
          } catch (err) {
            setErrorMessage(
              meals.barcodeError ||
              (language === 'de'
                ? 'Fehler beim Abrufen der Produktdaten'
                : 'Error fetching product data')
            );
            setState('error');
            console.error('[BarcodeScanner] Lookup error:', err);
          }
        },
        // Error callback (each frame that fails to decode — ignore)
        () => {},
      );
    } catch (err) {
      console.error('[BarcodeScanner] Camera error:', err);
      setErrorMessage(
        meals.barcodeCameraError ||
        (language === 'de'
          ? 'Kamera konnte nicht gestartet werden. Bitte Zugriff erlauben.'
          : 'Could not start camera. Please allow access.')
      );
      setState('error');
    }
  }, [stopScanner, onLookupUserProduct, meals, language]);

  // ── Retry ────────────────────────────────────────────────────────

  const handleRetry = useCallback(() => {
    setProduct(null);
    setFromUserProducts(false);
    setErrorMessage('');
    startScanning();
  }, [startScanning]);

  // ── Accept Result ────────────────────────────────────────────────

  const handleAccept = useCallback(() => {
    if (product) {
      onAccept({ product, fromUserProducts });
    }
  }, [product, fromUserProducts, onAccept]);

  // ── Close ────────────────────────────────────────────────────────

  const handleClose = useCallback(async () => {
    await stopScanner();
    onClose();
  }, [stopScanner, onClose]);

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <ScanBarcode className="h-4 w-4 text-teal-600" />
          {meals.barcodeScan || 'Barcode scannen'}
        </h3>
        <button
          type="button"
          onClick={handleClose}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* State: Idle — Start button */}
      {state === 'idle' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            {meals.barcodeHint ||
              (language === 'de'
                ? 'Scanne den Barcode eines Lebensmittels oder Supplements'
                : 'Scan the barcode of a food item or supplement')}
          </p>
          <button
            type="button"
            onClick={startScanning}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-700 text-sm font-medium hover:bg-teal-100 transition-colors"
          >
            <ScanBarcode className="h-5 w-5" />
            {meals.barcodeStartScan || (language === 'de' ? 'Scanner starten' : 'Start Scanner')}
          </button>
        </div>
      )}

      {/* State: Scanning — Camera viewfinder */}
      {(state === 'scanning' || state === 'found') && (
        <div className="space-y-2">
          <div
            id={SCANNER_CONTAINER_ID}
            className="rounded-xl overflow-hidden bg-black"
            style={{ minHeight: 220 }}
          />
          <p className="text-xs text-gray-500 text-center animate-pulse">
            {meals.barcodeScanning ||
              (language === 'de'
                ? 'Barcode vor die Kamera halten...'
                : 'Hold barcode in front of camera...')}
          </p>
        </div>
      )}

      {/* State: Loading — Spinner */}
      {state === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="bg-teal-50 rounded-full p-3">
            <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {meals.barcodeSearching ||
                (language === 'de' ? 'Produkt wird gesucht...' : 'Searching product...')}
            </p>
            <p className="text-xs text-gray-400 mt-1 font-mono">{scannedBarcode}</p>
          </div>
        </div>
      )}

      {/* State: Result — Product found */}
      {state === 'result' && product && (
        <div className="space-y-3">
          {/* Product image + name */}
          <div className="flex gap-3 bg-teal-50 rounded-lg p-3">
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-16 h-16 object-contain rounded-lg bg-white flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
              {product.brand && (
                <p className="text-xs text-gray-500 truncate">{product.brand}</p>
              )}
              <p className="text-[10px] text-gray-400 font-mono mt-1">{scannedBarcode}</p>
              {fromUserProducts && (
                <span className="inline-block mt-1 px-1.5 py-0.5 bg-teal-100 text-teal-700 text-[10px] font-medium rounded">
                  {meals.barcodeFromDB || (language === 'de' ? 'Aus deiner DB' : 'From your DB')}
                </span>
              )}
            </div>
          </div>

          {/* Macros (per 100g) */}
          <div>
            <p className="text-[10px] text-gray-400 mb-1">
              {language === 'de' ? 'Nährwerte pro 100g' : 'Nutrition per 100g'}
            </p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-400">{t.meals.calories}</p>
                <p className="text-sm font-bold text-gray-900">{product.calories}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-400">{t.meals.protein}</p>
                <p className="text-sm font-bold text-gray-900">{product.protein}g</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-400">{t.meals.carbs}</p>
                <p className="text-sm font-bold text-gray-900">{product.carbs}g</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-400">{t.meals.fat}</p>
                <p className="text-sm font-bold text-gray-900">{product.fat}g</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              {meals.barcodeRescan || (language === 'de' ? 'Erneut scannen' : 'Scan Again')}
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 transition-all"
            >
              <Check className="h-4 w-4" />
              {meals.barcodeUseProduct || (language === 'de' ? 'Übernehmen' : 'Use Product')}
            </button>
          </div>
        </div>
      )}

      {/* State: Error */}
      {state === 'error' && (
        <div className="space-y-3">
          <div className="bg-red-50 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">{errorMessage}</p>
              {scannedBarcode && (
                <p className="text-xs text-red-400 mt-1 font-mono">{scannedBarcode}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            {meals.barcodeRescan || (language === 'de' ? 'Erneut scannen' : 'Scan Again')}
          </button>
        </div>
      )}
    </div>
  );
}
