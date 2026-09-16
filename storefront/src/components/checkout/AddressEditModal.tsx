"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { User } from "@/contexts/AuthContext";
import { useCountryStates } from "@/hooks/useCountryStates";
import {
  type AddressFormData,
  addressToFormData,
  emptyAddress,
  formDataToAddress,
  updateAddressField,
} from "@/lib/utils/address";
import type { Address, Country, State } from "@/types/commerce";
import { AddressFormFields } from "./AddressFormFields";

interface AddressEditModalProps {
  address: Partial<Address> | null;
  countries: Country[];
  fetchStates: (countryIso: string) => Promise<State[]>;
  onSave: (
    data: ReturnType<typeof formDataToAddress>,
    id?: string,
  ) => Promise<void>;
  onClose: () => void;
  title?: string;
  user?: User | null;
}

export function AddressEditModal({
  address,
  countries,
  fetchStates,
  onSave,
  onClose,
  title,
  user,
}: AddressEditModalProps) {
  const t = useTranslations("address");
  const tc = useTranslations("common");
  const [formData, setFormData] = useState<AddressFormData>(() => {
    if (address) return addressToFormData(address);
    return {
      ...emptyAddress,
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
    };
  });
  const [states, loadingStates] = useCountryStates(
    formData.country_iso,
    fetchStates,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof AddressFormData, value: string) => {
    setFormData((prev) => updateAddressField(prev, field, value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await onSave(formDataToAddress(formData), address?.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToSave"));
    } finally {
      setSaving(false);
    }
  };

  const modalTitle =
    title ?? (address?.id ? t("editAddress") : t("addNewAddress"));

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="checkout-address-dialog sm:max-w-lg p-0 gap-0"
        showCloseButton={false}
      >
        <form onSubmit={handleSubmit}>
          <div className="px-4 pt-5 pb-4 sm:p-6">
            <DialogTitle className="text-lg font-medium text-gray-900 mb-4">
              {modalTitle}
            </DialogTitle>

            {error && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <AddressFormFields
              address={formData}
              countries={countries}
              states={states}
              loadingStates={loadingStates}
              onChange={handleChange}
              idPrefix="modal"
            />
          </div>

          <div className="checkout-address-dialog__actions">
            <Button
              type="submit"
              disabled={saving}
              className="checkout-address-dialog__save"
            >
              {saving ? tc("saving") : t("saveAddress")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="checkout-address-dialog__cancel"
            >
              {tc("cancel")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
