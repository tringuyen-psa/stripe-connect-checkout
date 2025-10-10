'use client';
import ShopifyInput from './ShopifyInput';
import ShopifyCard from './ShopifyCard';

export interface ContactFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface ContactFormProps {
  data: ContactFormData;
  onChange: (data: ContactFormData) => void;
  errors?: Partial<ContactFormData>;
}

export default function ContactForm({ data, onChange, errors }: ContactFormProps) {
  const handleInputChange = (field: keyof ContactFormData, event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...data,
      [field]: event.target.value
    });
  };

  return (
    <ShopifyCard>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>

      <div className="space-y-4">
        <ShopifyInput
          label="Email"
          type="email"
          value={data.email}
          onChange={(e) => handleInputChange('email', e)}
          error={errors?.email}
          placeholder="email@example.com"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ShopifyInput
            label="First Name"
            value={data.firstName}
            onChange={(e) => handleInputChange('firstName', e)}
            error={errors?.firstName}
            required
          />
          <ShopifyInput
            label="Last Name"
            value={data.lastName}
            onChange={(e) => handleInputChange('lastName', e)}
            error={errors?.lastName}
            required
          />
        </div>

        <ShopifyInput
          label="Phone (optional)"
          type="tel"
          value={data.phone}
          onChange={(e) => handleInputChange('phone', e)}
          error={errors?.phone}
          placeholder="+1 (555) 123-4567"
        />

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium">Order updates</p>
              <p className="mt-1">We&apos;ll send you updates about your order status and shipping information.</p>
            </div>
          </div>
        </div>
      </div>
    </ShopifyCard>
  );
}