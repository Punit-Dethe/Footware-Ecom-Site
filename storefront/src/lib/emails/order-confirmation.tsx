import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "react-email";
import { getStoreName, getStoreUrl } from "@/lib/store";

export interface OrderConfirmationLineItem {
  name: string;
  slug?: string;
  quantity: number;
  options_text?: string;
  display_price: string;
  display_total: string;
  thumbnail_url?: string | null;
}

export interface OrderConfirmationAddress {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state_text?: string | null;
  postal_code?: string | null;
  country_name?: string | null;
  phone?: string | null;
}

export interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  storeName?: string;
  storeUrl?: string;
  items: OrderConfirmationLineItem[];
  displayItemTotal: string;
  displayDeliveryTotal: string;
  displayDiscountTotal?: string;
  displayTaxTotal: string;
  displayTotal: string;
  shippingAddress?: OrderConfirmationAddress;
  billingAddress?: OrderConfirmationAddress;
  deliveryMethodName?: string;
  orderDate?: string;
}

export function OrderConfirmationEmail({
  orderNumber,
  customerName,
  storeName = getStoreName(),
  storeUrl = getStoreUrl(),
  items,
  displayItemTotal,
  displayDeliveryTotal,
  displayDiscountTotal,
  displayTaxTotal,
  displayTotal,
  shippingAddress,
  billingAddress,
  deliveryMethodName,
  orderDate,
}: OrderConfirmationEmailProps) {
  const firstName = customerName?.trim()
    ? customerName.trim().split(" ")[0]
    : "there";

  const formattedDate =
    orderDate ||
    new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const previewText = `Thank you for your order, ${firstName}. Order ${orderNumber} is confirmed.`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Brand Identity */}
          <Section style={brandSection}>
            <Text style={brandHeading}>MIRZA</Text>
            <Text style={brandDescriptor}>FOOTWEAR</Text>
          </Section>

          <Hr style={hairlineRule} />

          {/* Editorial Header */}
          <Section style={heroSection}>
            <Text style={utilityEyebrow}>ORDER CONFIRMATION</Text>
            <Heading as="h1" style={editorialTitle}>
              Order Confirmed
            </Heading>
            <Text style={bodyText}>
              {`Dear ${firstName}, thank you for choosing Mirza. Your order has been received and is being prepared with artisanal care.`}
            </Text>

            {/* Order Meta Bar */}
            <Section style={metaBox}>
              <Row>
                <Column style={metaColumnLeft}>
                  <Text style={metaLabel}>ORDER NUMBER</Text>
                  <Text style={metaValue}>{orderNumber}</Text>
                </Column>
                <Column style={metaColumnRight}>
                  <Text style={metaLabel}>ORDER DATE</Text>
                  <Text style={metaValue}>{formattedDate}</Text>
                </Column>
              </Row>
            </Section>
          </Section>

          <Hr style={hairlineRule} />

          {/* Order Summary & Line Items */}
          <Section style={sectionWrapper}>
            <Text style={utilitySectionHeader}>ORDER SUMMARY</Text>

            {items.map((item, index) => (
              <Row
                key={`${item.name}-${item.options_text ?? index}`}
                style={itemRowStyle}
              >
                <Column style={imageColStyle}>
                  {item.thumbnail_url ? (
                    <Img
                      src={item.thumbnail_url}
                      alt={item.name}
                      width={64}
                      height={64}
                      style={thumbnailStyle}
                    />
                  ) : (
                    <div style={thumbnailPlaceholder} />
                  )}
                </Column>

                <Column style={itemDetailsColStyle}>
                  <Text style={itemNameStyle}>
                    {storeUrl && item.slug ? (
                      <Link
                        href={`${storeUrl}/products/${item.slug}`}
                        style={itemLinkStyle}
                      >
                        {item.name}
                      </Link>
                    ) : (
                      item.name
                    )}
                  </Text>
                  {item.options_text ? (
                    <Text style={itemOptionStyle}>{item.options_text}</Text>
                  ) : null}
                  <Text style={itemQtyStyle}>Quantity: {item.quantity}</Text>
                </Column>

                <Column style={itemPriceColStyle}>
                  <Text style={itemPriceStyle}>{item.display_total}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hairlineRule} />

          {/* Pricing Totals */}
          <Section style={totalsSectionStyle}>
            <Row style={totalRowStyle}>
              <Column style={totalLabelStyle}>Subtotal</Column>
              <Column style={totalValueStyle}>{displayItemTotal}</Column>
            </Row>

            <Row style={totalRowStyle}>
              <Column style={totalLabelStyle}>
                Shipping
                {deliveryMethodName ? ` (${deliveryMethodName})` : ""}
              </Column>
              <Column style={totalValueStyle}>{displayDeliveryTotal}</Column>
            </Row>

            {displayDiscountTotal &&
            Number.parseFloat(displayDiscountTotal.replace(/[^0-9.-]/g, "")) !==
              0 ? (
              <Row style={totalRowStyle}>
                <Column style={totalLabelStyle}>Special Privilege</Column>
                <Column style={discountValueStyle}>{displayDiscountTotal}</Column>
              </Row>
            ) : null}

            {displayTaxTotal &&
            Number.parseFloat(displayTaxTotal.replace(/[^0-9.-]/g, "")) > 0 ? (
              <Row style={totalRowStyle}>
                <Column style={totalLabelStyle}>Estimated Tax</Column>
                <Column style={totalValueStyle}>{displayTaxTotal}</Column>
              </Row>
            ) : null}

            <Row style={grandTotalRowStyle}>
              <Column style={grandTotalLabelStyle}>Total</Column>
              <Column style={grandTotalValueStyle}>{displayTotal}</Column>
            </Row>
          </Section>

          <Hr style={hairlineRule} />

          {/* Shipping & Delivery Info */}
          <Section style={sectionWrapper}>
            <Text style={utilitySectionHeader}>DELIVERY DETAILS</Text>
            <Row>
              {shippingAddress ? (
                <Column style={addressColumnStyle}>
                  <Text style={addressSubHeader}>Shipping Address</Text>
                  <AddressBlock address={shippingAddress} />
                </Column>
              ) : null}

              {billingAddress && billingAddress !== shippingAddress ? (
                <Column style={addressColumnStyle}>
                  <Text style={addressSubHeader}>Billing Address</Text>
                  <AddressBlock address={billingAddress} />
                </Column>
              ) : null}
            </Row>
          </Section>

          <Hr style={hairlineRule} />

          {/* Restrained Editorial Closing & Footer */}
          <Section style={footerSection}>
            <Text style={closingNote}>
              Each pair of Mirza footwear is crafted to endure. Should you have
              any inquiries regarding sizing, care, or delivery, simply reply to
              this email.
            </Text>
            <Text style={footerBrandSignature}>
              MIRZA FOOTWEAR
              {storeUrl ? (
                <>
                  {" · "}
                  <Link
                    href={storeUrl}
                    style={footerLinkStyle}
                  >
                    mirzafootwear.com
                  </Link>
                </>
              ) : null}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function AddressBlock({ address }: { address: OrderConfirmationAddress }) {
  const name =
    address.full_name ||
    [address.first_name, address.last_name].filter(Boolean).join(" ");

  const cityLine = [
    address.city,
    [address.state_text, address.postal_code].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      {name ? <Text style={addressLineStyle}>{name}</Text> : null}
      {address.address1 ? (
        <Text style={addressLineStyle}>{address.address1}</Text>
      ) : null}
      {address.address2 ? (
        <Text style={addressLineStyle}>{address.address2}</Text>
      ) : null}
      {cityLine ? <Text style={addressLineStyle}>{cityLine}</Text> : null}
      {address.country_name ? (
        <Text style={addressLineStyle}>{address.country_name}</Text>
      ) : null}
      {address.phone ? (
        <Text style={addressLineStyle}>{address.phone}</Text>
      ) : null}
    </>
  );
}

/* =========================================================================
   Mirza Editorial Typography & Color Styles
   ========================================================================= */

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f3efe8",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: "32px 12px",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#fffefc",
  border: "1px solid #e8e4dc",
  margin: "0 auto",
  maxWidth: "580px",
  padding: "44px 36px 36px 36px",
};

const brandSection: React.CSSProperties = {
  textAlign: "center" as const,
  marginBottom: "8px",
};

const brandHeading: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "26px",
  fontWeight: 600,
  letterSpacing: "0.26em",
  lineHeight: "1",
  color: "#211b17",
  margin: "0 0 6px 0",
  paddingLeft: "0.26em", // balances letter-spacing visually
};

const brandDescriptor: React.CSSProperties = {
  fontSize: "8px",
  fontWeight: 600,
  letterSpacing: "0.36em",
  color: "#7d7268",
  textTransform: "uppercase" as const,
  margin: 0,
  paddingLeft: "0.36em",
};

const hairlineRule: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #e8e4dc",
  margin: "24px 0",
};

const heroSection: React.CSSProperties = {
  padding: "4px 0 0 0",
};

const utilityEyebrow: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 600,
  letterSpacing: "0.22em",
  color: "#7d7268",
  textTransform: "uppercase" as const,
  margin: "0 0 10px 0",
};

const editorialTitle: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "26px",
  fontWeight: 400,
  lineHeight: "1.2",
  color: "#211b17",
  margin: "0 0 12px 0",
};

const bodyText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "22px",
  color: "#544941",
  margin: "0 0 18px 0",
};

const metaBox: React.CSSProperties = {
  backgroundColor: "#fdfbf7",
  border: "1px solid #e8e4dc",
  padding: "12px 16px",
  margin: "6px 0 0 0",
};

const metaColumnLeft: React.CSSProperties = {
  verticalAlign: "top",
  width: "55%",
};

const metaColumnRight: React.CSSProperties = {
  verticalAlign: "top",
  width: "45%",
  textAlign: "right" as const,
};

const metaLabel: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 600,
  letterSpacing: "0.18em",
  color: "#7d7268",
  textTransform: "uppercase" as const,
  margin: "0 0 4px 0",
};

const metaValue: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#211b17",
  margin: 0,
  fontFamily: 'Georgia, "Times New Roman", serif',
};

const sectionWrapper: React.CSSProperties = {
  padding: "4px 0",
};

const utilitySectionHeader: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 600,
  letterSpacing: "0.22em",
  color: "#7d7268",
  textTransform: "uppercase" as const,
  margin: "0 0 18px 0",
};

const itemRowStyle: React.CSSProperties = {
  marginBottom: "16px",
};

const imageColStyle: React.CSSProperties = {
  width: "64px",
  verticalAlign: "top",
};

const thumbnailStyle: React.CSSProperties = {
  borderRadius: "2px",
  border: "1px solid #e8e4dc",
  objectFit: "cover" as const,
  display: "block",
};

const thumbnailPlaceholder: React.CSSProperties = {
  width: "64px",
  height: "64px",
  backgroundColor: "#f3efe8",
  border: "1px solid #e8e4dc",
  borderRadius: "2px",
};

const itemDetailsColStyle: React.CSSProperties = {
  paddingLeft: "14px",
  verticalAlign: "top",
};

const itemNameStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  lineHeight: "18px",
  color: "#211b17",
  margin: "0 0 4px 0",
};

const itemLinkStyle: React.CSSProperties = {
  color: "#211b17",
  textDecoration: "none",
};

const itemOptionStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#7d7268",
  margin: "0 0 2px 0",
};

const itemQtyStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#7d7268",
  margin: 0,
};

const itemPriceColStyle: React.CSSProperties = {
  textAlign: "right" as const,
  verticalAlign: "top",
  width: "90px",
};

const itemPriceStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  color: "#211b17",
  margin: 0,
};

const totalsSectionStyle: React.CSSProperties = {
  width: "100%",
};

const totalRowStyle: React.CSSProperties = {
  marginBottom: "6px",
};

const totalLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#7d7268",
  paddingBottom: "6px",
};

const totalValueStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#211b17",
  textAlign: "right" as const,
  paddingBottom: "6px",
};

const discountValueStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#2d6a4f",
  textAlign: "right" as const,
  paddingBottom: "6px",
};

const grandTotalRowStyle: React.CSSProperties = {
  borderTop: "1px solid #e8e4dc",
  paddingTop: "10px",
  marginTop: "4px",
};

const grandTotalLabelStyle: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "15px",
  fontWeight: 600,
  color: "#211b17",
  paddingTop: "6px",
};

const grandTotalValueStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#211b17",
  textAlign: "right" as const,
  paddingTop: "6px",
};

const addressColumnStyle: React.CSSProperties = {
  verticalAlign: "top",
  width: "50%",
  paddingRight: "12px",
};

const addressSubHeader: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color: "#211b17",
  margin: "0 0 6px 0",
};

const addressLineStyle: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#544941",
  margin: 0,
};

const footerSection: React.CSSProperties = {
  textAlign: "center" as const,
  paddingTop: "4px",
};

const closingNote: React.CSSProperties = {
  fontSize: "11px",
  lineHeight: "18px",
  color: "#7d7268",
  fontStyle: "italic",
  margin: "0 0 16px 0",
};

const footerBrandSignature: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 600,
  letterSpacing: "0.22em",
  color: "#a49b91",
  textTransform: "uppercase" as const,
  margin: 0,
};

const footerLinkStyle: React.CSSProperties = {
  color: "#7d7268",
  textDecoration: "none",
};
