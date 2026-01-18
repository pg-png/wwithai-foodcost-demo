"use client";

import { useState, useCallback } from "react";

type InvoiceItem = {
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
};

type ExtractedData = {
  invoice_number: string;
  restaurant: string;
  supplier: string;
  invoice_date: string;
  currency: string;
  total_amount: number;
  items_count: number;
  items: InvoiceItem[];
  drive_file_link: string;
  drive_file_id: string;
};

type PreviewResponse = {
  success: boolean;
  is_duplicate: boolean;
  duplicate_id: string | null;
  extracted_data: ExtractedData;
};

const WEBHOOK_EXTRACT = "https://hanumet.app.n8n.cloud/webhook/demo-invoice-extract";
const WEBHOOK_CONFIRM = "https://hanumet.app.n8n.cloud/webhook/demo-invoice-confirm";
const NOTION_DB_URL = "https://www.notion.so/2ece4eb3a20581239734ed7e5a7546dc";

export default function Home() {
  const [step, setStep] = useState<"upload" | "processing" | "preview" | "saving" | "success">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
      setError(null);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const processInvoice = async () => {
    if (!file) return;

    setStep("processing");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(WEBHOOK_EXTRACT, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process invoice");
      }

      const data: PreviewResponse = await response.json();

      if (data.success) {
        setExtractedData(data.extracted_data);
        setIsDuplicate(data.is_duplicate);
        setStep("preview");
      } else {
        throw new Error("Failed to extract invoice data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("upload");
    }
  };

  const confirmInvoice = async () => {
    if (!extractedData) return;

    setStep("saving");
    setError(null);

    try {
      const response = await fetch(WEBHOOK_CONFIRM, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(extractedData),
      });

      if (!response.ok) {
        throw new Error("Failed to save invoice");
      }

      const data = await response.json();

      if (data.success) {
        setSavedInvoiceId(data.invoice_id);
        setStep("success");
      } else {
        throw new Error("Failed to save invoice");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("preview");
    }
  };

  const reset = () => {
    setStep("upload");
    setFile(null);
    setPreview(null);
    setExtractedData(null);
    setIsDuplicate(false);
    setError(null);
    setSavedInvoiceId(null);
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Food Cost Sentinel
          </h1>
          <p className="text-gray-600">
            AI-powered invoice capture for restaurants
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <StepIndicator number={1} label="Upload" active={step === "upload" || step === "processing"} completed={step !== "upload" && step !== "processing"} />
            <div className="w-12 h-0.5 bg-gray-300" />
            <StepIndicator number={2} label="Review" active={step === "preview"} completed={step === "saving" || step === "success"} />
            <div className="w-12 h-0.5 bg-gray-300" />
            <StepIndicator number={3} label="Save" active={step === "saving" || step === "success"} completed={step === "success"} />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Upload Step */}
        {step === "upload" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                file ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-blue-400"
              }`}
            >
              {preview ? (
                <div>
                  <img
                    src={preview}
                    alt="Invoice preview"
                    className="max-h-64 mx-auto mb-4 rounded-lg shadow"
                  />
                  <p className="text-sm text-gray-600 mb-4">{file?.name}</p>
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove and select another
                  </button>
                </div>
              ) : (
                <div>
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drop your invoice here
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    Select File
                  </label>
                </div>
              )}
            </div>

            {file && (
              <button
                onClick={processInvoice}
                className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Extract Invoice Data
              </button>
            )}
          </div>
        )}

        {/* Processing Step */}
        {step === "processing" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Processing Invoice...
            </h2>
            <p className="text-gray-600">
              AI is extracting data from your invoice
            </p>
          </div>
        )}

        {/* Preview Step */}
        {step === "preview" && extractedData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            {isDuplicate && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                This invoice may already exist in the database.
              </div>
            )}

            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Extracted Invoice Data
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <InfoField label="Invoice #" value={extractedData.invoice_number} />
              <InfoField label="Supplier" value={extractedData.supplier} />
              <InfoField label="Date" value={extractedData.invoice_date} />
              <InfoField label="Location" value={extractedData.restaurant} />
              <InfoField
                label="Total"
                value={`${extractedData.currency} $${extractedData.total_amount.toFixed(2)}`}
              />
              <InfoField label="Items" value={`${extractedData.items_count} line items`} />
            </div>

            {extractedData.items.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Line Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-600">Product</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-600">Qty</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-600">Unit Price</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {extractedData.items.slice(0, 5).map((item, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-gray-900">{item.product_name}</td>
                          <td className="px-4 py-2 text-right text-gray-600">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-600">
                            ${item.unit_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900">
                            ${item.line_total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {extractedData.items.length > 5 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-center text-gray-500 text-sm">
                            + {extractedData.items.length - 5} more items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={reset}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmInvoice}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Save to Database
              </button>
            </div>
          </div>
        )}

        {/* Saving Step */}
        {step === "saving" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Saving Invoice...
            </h2>
            <p className="text-gray-600">
              Storing data in your Notion database
            </p>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Invoice Saved!
            </h2>
            <p className="text-gray-600 mb-6">
              Your invoice has been captured and stored successfully.
            </p>

            <div className="flex flex-col gap-3">
              <a
                href={NOTION_DB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                View in Notion Database
              </a>
              <button
                onClick={reset}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Capture Another Invoice
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Powered by{" "}
          <a href="https://wwithai.com" className="text-blue-600 hover:underline">
            WWITHai
          </a>
        </div>
      </div>
    </main>
  );
}

function StepIndicator({ number, label, active, completed }: { number: number; label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
          completed
            ? "bg-green-600 text-white"
            : active
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-600"
        }`}
      >
        {completed ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          number
        )}
      </div>
      <span className={`mt-1 text-xs ${active || completed ? "text-gray-900" : "text-gray-500"}`}>
        {label}
      </span>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="text-gray-900 font-medium">{value || "—"}</dd>
    </div>
  );
}
