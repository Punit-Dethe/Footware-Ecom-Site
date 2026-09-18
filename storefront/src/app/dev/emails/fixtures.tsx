import { createElement, type ReactElement } from "react";
import { OrderCanceledEmail } from "@/lib/emails/order-canceled";
import { OrderConfirmationEmail } from "@/lib/emails/order-confirmation";
import { PasswordResetEmail } from "@/lib/emails/password-reset";
import { ShipmentShippedEmail } from "@/lib/emails/shipment-shipped";

interface EmailFixture {
  slug: string;
  label: string;
  render: () => ReactElement;
}

export const emailFixtures: EmailFixture[] = [
  {
    slug: "order-confirmation",
    label: "Order Confirmation (Multi-item, Mirza Footwear)",
    render: () =>
      createElement(OrderConfirmationEmail, {
        orderNumber: "MRZ-9K2M4P7X1R",
        customerName: "Jane Smith",
        items: [
          {
            name: "The Sovereign Oxford in Patina Calfskin",
            slug: "shoe-2026-09-001",
            quantity: 1,
            options_text: "Size: 42 EU / 9 US",
            display_price: "$385.00",
            display_total: "$385.00",
            thumbnail_url: "https://hkncfdsvgjopkujmmxem.supabase.co/storage/v1/object/public/product-media/products/shoe-2026-09-001/variants/640.webp",
          },
          {
            name: "Artisanal Horsehair Polishing Brush",
            slug: "shoe-2026-09-002",
            quantity: 2,
            options_text: "Finish: Dark Walnut",
            display_price: "$45.00",
            display_total: "$90.00",
            thumbnail_url: null,
          },
        ],
        displayItemTotal: "$475.00",
        displayDeliveryTotal: "Complimentary",
        displayTaxTotal: "$38.00",
        displayTotal: "$513.00",
        shippingAddress: {
          full_name: "Jane Smith",
          address1: "742 Evergreen Terrace",
          address2: "Suite 4B",
          city: "Springfield",
          state_text: "OR",
          postal_code: "97477",
          country_name: "United States",
          phone: "+1 (541) 555-0199",
        },
        deliveryMethodName: "White Glove Express Delivery",
      }),
  },
  {
    slug: "order-confirmation-single",
    label: "Order Confirmation (Single Item)",
    render: () =>
      createElement(OrderConfirmationEmail, {
        orderNumber: "MRZ-3N8V1B6Q5T",
        customerName: "Edward Norton",
        items: [
          {
            name: "The Viceroy Wholecut in Espresso Box Calf",
            slug: "shoe-2026-09-003",
            quantity: 1,
            options_text: "Size: 43 EU / 10 US",
            display_price: "$420.00",
            display_total: "$420.00",
            thumbnail_url: "https://hkncfdsvgjopkujmmxem.supabase.co/storage/v1/object/public/product-media/products/shoe-2026-09-003/variants/640.webp",
          },
        ],
        displayItemTotal: "$420.00",
        displayDeliveryTotal: "Complimentary",
        displayTaxTotal: "$33.60",
        displayTotal: "$453.60",
        shippingAddress: {
          full_name: "Edward Norton",
          address1: "10 Downing Street",
          city: "London",
          state_text: "Greater London",
          postal_code: "SW1A 2AA",
          country_name: "United Kingdom",
        },
        deliveryMethodName: "International Priority",
      }),
  },
  {
    slug: "order-confirmation-edge-cases",
    label: "Order Confirmation (Edge Cases: Long Title, Missing Name)",
    render: () =>
      createElement(OrderConfirmationEmail, {
        orderNumber: "MRZ-7H9X2K4M1L",
        customerName: "", // Missing customer name fallback
        items: [
          {
            name: "Handcrafted Heritage Derby in Vegetable-Tanned Full-Grain Tuscan Leather with Commando Lug Sole and Norwegian Welt Stitching",
            quantity: 1,
            options_text: "Custom Monogram: M.A. | Size: 44 EU / 11 US",
            display_price: "$560.00",
            display_total: "$560.00",
            thumbnail_url: null,
          },
        ],
        displayItemTotal: "$560.00",
        displayDeliveryTotal: "$25.00",
        displayTaxTotal: "$44.80",
        displayTotal: "$629.80",
        shippingAddress: {
          address1: "Rural Delivery Route 4, Box 212",
          city: "Taos",
          state_text: "NM",
          postal_code: "87571",
          country_name: "United States",
        },
      }),
  },
  {
    slug: "order-canceled",
    label: "Order Canceled",
    render: () =>
      createElement(OrderCanceledEmail, {
        orderNumber: "R987654321",
        customerName: "Jane Smith",
        items: [
          {
            name: "Classic Tote Bag",
            slug: "classic-tote-bag",
            quantity: 2,
            options_text: "Color: Black",
            display_total: "$59.98",
            thumbnail_url: null,
          },
          {
            name: "Organic Cotton T-Shirt",
            slug: "organic-cotton-t-shirt",
            quantity: 1,
            options_text: "Size: M, Color: White",
            display_total: "$24.99",
            thumbnail_url: null,
          },
        ],
        displayTotal: "$84.97",
      }),
  },
  {
    slug: "shipment-shipped",
    label: "Shipment Shipped",
    render: () =>
      createElement(ShipmentShippedEmail, {
        orderNumber: "R987654321",
        customerName: "Jane Smith",
        shipments: [
          {
            number: "H123456789",
            tracking: "1Z999AA10123456784",
            tracking_url:
              "https://tools.usps.com/go/TrackConfirmAction?tLabels=1Z999AA10123456784",
            delivery_method_name: "USPS Priority Mail",
            display_cost: "$5.99",
            items: [
              {
                name: "Classic Tote Bag",
                slug: "classic-tote-bag",
                quantity: 2,
                options_text: "Color: Black",
                thumbnail_url: null,
              },
              {
                name: "Organic Cotton T-Shirt",
                slug: "organic-cotton-t-shirt",
                quantity: 1,
                options_text: "Size: M, Color: White",
                thumbnail_url: null,
              },
            ],
          },
        ],
      }),
  },
  {
    slug: "password-reset",
    label: "Password Reset",
    render: () =>
      createElement(PasswordResetEmail, {
        resetUrl: "https://example.com/account/reset-password?token=preview",
      }),
  },
];

export function getEmailFixture(slug: string): EmailFixture | undefined {
  return emailFixtures.find((f) => f.slug === slug);
}
