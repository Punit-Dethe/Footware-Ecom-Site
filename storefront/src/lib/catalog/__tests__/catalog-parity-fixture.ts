// Test-only baseline fixture capturing static catalog before B6A PostgreSQL migration.
// DO NOT import into production runtime.

export const EXPECTED_CATEGORIES = [
  {
    "id": "7",
    "name": "Office Wear",
    "permalink": "categories/office-wear",
    "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
    "parent_id": null,
    "children": [],
    "ancestors": []
  },
  {
    "id": "8",
    "name": "Traditional",
    "permalink": "categories/traditional",
    "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
    "parent_id": null,
    "children": [],
    "ancestors": []
  }
] as const;

export const EXPECTED_PRODUCTS = [
  {
    "id": "prod_mirza_office_footwear_01",
    "name": "The Sovereign Wholecut Oxford",
    "slug": "office-footwear-01",
    "sku": "MIRZA-OFF-001",
    "description": "Crafted from a single piece of flawless Italian calfskin leather with closed lacing and Goodyear-welted sole.",
    "description_html": "<p>Crafted from a single piece of flawless Italian calfskin leather with closed lacing and Goodyear-welted sole.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Sovereign Wholecut Oxford | Mirza Footwear",
    "meta_description": "Crafted from a single piece of flawless Italian calfskin leather with closed lacing and Goodyear-welted sole.",
    "meta_keywords": "The Sovereign Wholecut Oxford, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-01/74b3f715/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_01_1",
      "url": "/products/office-footwear-01/74b3f715/card-lg-640.webp",
      "alt": "The Sovereign Wholecut Oxford",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-01/74b3f715/zoom-1600.webp",
      "large_url": "/products/office-footwear-01/74b3f715/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-01/74b3f715/zoom-1600.webp",
      "small_url": "/products/office-footwear-01/74b3f715/card-sm-320.webp",
      "mini_url": "/products/office-footwear-01/74b3f715/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_01_7",
        "var_office_footwear_01_8",
        "var_office_footwear_01_9",
        "var_office_footwear_01_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_01_1",
        "url": "/products/office-footwear-01/74b3f715/card-lg-640.webp",
        "alt": "The Sovereign Wholecut Oxford",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-01/74b3f715/zoom-1600.webp",
        "large_url": "/products/office-footwear-01/74b3f715/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-01/74b3f715/zoom-1600.webp",
        "small_url": "/products/office-footwear-01/74b3f715/card-sm-320.webp",
        "mini_url": "/products/office-footwear-01/74b3f715/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_01_7",
          "var_office_footwear_01_8",
          "var_office_footwear_01_9",
          "var_office_footwear_01_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-01/74b3f715/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRkYAAABXRUJQVlA4IDoAAACwAQCdASoQABAABUB8JZwAAhcjN1IAAP7idPrU1us5NlRauzXuR3DV8g/7wRi/nU0/Sr+oxzA3QgAA",
      "dominantColor": "#887868",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-01/74b3f715/thumb-160.avif",
          "webp": "/products/office-footwear-01/74b3f715/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-01/74b3f715/card-sm-320.avif",
          "webp": "/products/office-footwear-01/74b3f715/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-01/74b3f715/card-480.avif",
          "webp": "/products/office-footwear-01/74b3f715/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-01/74b3f715/card-lg-640.avif",
          "webp": "/products/office-footwear-01/74b3f715/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-01/74b3f715/pdp-960.avif",
          "webp": "/products/office-footwear-01/74b3f715/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-01/74b3f715/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-01/74b3f715/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-01/74b3f715/zoom-1600.avif",
          "webp": "/products/office-footwear-01/74b3f715/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "285.00",
      "currency": "USD",
      "display_amount": "$285.00",
      "amount_in_cents": 28500,
      "compare_at_amount": "327.75",
      "compare_at_amount_in_cents": 32775,
      "display_compare_at_amount": "$327.75"
    },
    "original_price": {
      "amount": "285.00",
      "currency": "USD",
      "display_amount": "$285.00",
      "amount_in_cents": 28500
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_01_8",
    "default_variant": {
      "id": "var_office_footwear_01_8",
      "product_id": "prod_mirza_office_footwear_01",
      "is_master": true,
      "sku": "MIRZA-OFF-001-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "285.00",
        "currency": "USD",
        "display_amount": "$285.00",
        "amount_in_cents": 28500,
        "compare_at_amount_in_cents": 32775,
        "display_compare_at_amount": "$327.75"
      },
      "original_price": {
        "amount": "285.00",
        "currency": "USD",
        "display_amount": "$285.00",
        "amount_in_cents": 28500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_01_7",
        "product_id": "prod_mirza_office_footwear_01",
        "is_master": false,
        "sku": "MIRZA-OFF-001-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "285.00",
          "currency": "USD",
          "display_amount": "$285.00",
          "amount_in_cents": 28500,
          "compare_at_amount_in_cents": 32775,
          "display_compare_at_amount": "$327.75"
        },
        "original_price": {
          "amount": "285.00",
          "currency": "USD",
          "display_amount": "$285.00",
          "amount_in_cents": 28500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_01_8",
        "product_id": "prod_mirza_office_footwear_01",
        "is_master": true,
        "sku": "MIRZA-OFF-001-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "285.00",
          "currency": "USD",
          "display_amount": "$285.00",
          "amount_in_cents": 28500,
          "compare_at_amount_in_cents": 32775,
          "display_compare_at_amount": "$327.75"
        },
        "original_price": {
          "amount": "285.00",
          "currency": "USD",
          "display_amount": "$285.00",
          "amount_in_cents": 28500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_01_9",
        "product_id": "prod_mirza_office_footwear_01",
        "is_master": false,
        "sku": "MIRZA-OFF-001-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "285.00",
          "currency": "USD",
          "display_amount": "$285.00",
          "amount_in_cents": 28500,
          "compare_at_amount_in_cents": 32775,
          "display_compare_at_amount": "$327.75"
        },
        "original_price": {
          "amount": "285.00",
          "currency": "USD",
          "display_amount": "$285.00",
          "amount_in_cents": 28500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_01_10",
        "product_id": "prod_mirza_office_footwear_01",
        "is_master": false,
        "sku": "MIRZA-OFF-001-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "285.00",
          "currency": "USD",
          "display_amount": "$285.00",
          "amount_in_cents": 28500,
          "compare_at_amount_in_cents": 32775,
          "display_compare_at_amount": "$327.75"
        },
        "original_price": {
          "amount": "285.00",
          "currency": "USD",
          "display_amount": "$285.00",
          "amount_in_cents": 28500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_02",
    "name": "The Heritage Wingtip Derby",
    "slug": "office-footwear-02",
    "sku": "MIRZA-OFF-002",
    "description": "Classic open-laced derby featuring intricate broguing, burnished chestnut leather, and stacked heel.",
    "description_html": "<p>Classic open-laced derby featuring intricate broguing, burnished chestnut leather, and stacked heel.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Heritage Wingtip Derby | Mirza Footwear",
    "meta_description": "Classic open-laced derby featuring intricate broguing, burnished chestnut leather, and stacked heel.",
    "meta_keywords": "The Heritage Wingtip Derby, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-02/2f718e49/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_02_1",
      "url": "/products/office-footwear-02/2f718e49/card-lg-640.webp",
      "alt": "The Heritage Wingtip Derby",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-02/2f718e49/zoom-1600.webp",
      "large_url": "/products/office-footwear-02/2f718e49/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-02/2f718e49/zoom-1600.webp",
      "small_url": "/products/office-footwear-02/2f718e49/card-sm-320.webp",
      "mini_url": "/products/office-footwear-02/2f718e49/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_02_7",
        "var_office_footwear_02_8",
        "var_office_footwear_02_9",
        "var_office_footwear_02_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_02_1",
        "url": "/products/office-footwear-02/2f718e49/card-lg-640.webp",
        "alt": "The Heritage Wingtip Derby",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-02/2f718e49/zoom-1600.webp",
        "large_url": "/products/office-footwear-02/2f718e49/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-02/2f718e49/zoom-1600.webp",
        "small_url": "/products/office-footwear-02/2f718e49/card-sm-320.webp",
        "mini_url": "/products/office-footwear-02/2f718e49/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_02_7",
          "var_office_footwear_02_8",
          "var_office_footwear_02_9",
          "var_office_footwear_02_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-02/2f718e49/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAADQAQCdASoQABAABUB8JaQAAh+q4aJ8HAD+jHn5I0HZ7udjfLrl+RGszdDwgd1Q1czzUIo50/D2/3K3z5fsmIRBl+iuFcRjt/XHAAAA",
      "dominantColor": "#b8b8b8",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-02/2f718e49/thumb-160.avif",
          "webp": "/products/office-footwear-02/2f718e49/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-02/2f718e49/card-sm-320.avif",
          "webp": "/products/office-footwear-02/2f718e49/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-02/2f718e49/card-480.avif",
          "webp": "/products/office-footwear-02/2f718e49/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-02/2f718e49/card-lg-640.avif",
          "webp": "/products/office-footwear-02/2f718e49/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-02/2f718e49/pdp-960.avif",
          "webp": "/products/office-footwear-02/2f718e49/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-02/2f718e49/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-02/2f718e49/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-02/2f718e49/zoom-1600.avif",
          "webp": "/products/office-footwear-02/2f718e49/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "265.00",
      "currency": "USD",
      "display_amount": "$265.00",
      "amount_in_cents": 26500,
      "compare_at_amount": "304.75",
      "compare_at_amount_in_cents": 30475,
      "display_compare_at_amount": "$304.75"
    },
    "original_price": {
      "amount": "265.00",
      "currency": "USD",
      "display_amount": "$265.00",
      "amount_in_cents": 26500
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_02_8",
    "default_variant": {
      "id": "var_office_footwear_02_8",
      "product_id": "prod_mirza_office_footwear_02",
      "is_master": true,
      "sku": "MIRZA-OFF-002-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "265.00",
        "currency": "USD",
        "display_amount": "$265.00",
        "amount_in_cents": 26500,
        "compare_at_amount_in_cents": 30475,
        "display_compare_at_amount": "$304.75"
      },
      "original_price": {
        "amount": "265.00",
        "currency": "USD",
        "display_amount": "$265.00",
        "amount_in_cents": 26500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_02_7",
        "product_id": "prod_mirza_office_footwear_02",
        "is_master": false,
        "sku": "MIRZA-OFF-002-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "265.00",
          "currency": "USD",
          "display_amount": "$265.00",
          "amount_in_cents": 26500,
          "compare_at_amount_in_cents": 30475,
          "display_compare_at_amount": "$304.75"
        },
        "original_price": {
          "amount": "265.00",
          "currency": "USD",
          "display_amount": "$265.00",
          "amount_in_cents": 26500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_02_8",
        "product_id": "prod_mirza_office_footwear_02",
        "is_master": true,
        "sku": "MIRZA-OFF-002-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "265.00",
          "currency": "USD",
          "display_amount": "$265.00",
          "amount_in_cents": 26500,
          "compare_at_amount_in_cents": 30475,
          "display_compare_at_amount": "$304.75"
        },
        "original_price": {
          "amount": "265.00",
          "currency": "USD",
          "display_amount": "$265.00",
          "amount_in_cents": 26500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_02_9",
        "product_id": "prod_mirza_office_footwear_02",
        "is_master": false,
        "sku": "MIRZA-OFF-002-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "265.00",
          "currency": "USD",
          "display_amount": "$265.00",
          "amount_in_cents": 26500,
          "compare_at_amount_in_cents": 30475,
          "display_compare_at_amount": "$304.75"
        },
        "original_price": {
          "amount": "265.00",
          "currency": "USD",
          "display_amount": "$265.00",
          "amount_in_cents": 26500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_02_10",
        "product_id": "prod_mirza_office_footwear_02",
        "is_master": false,
        "sku": "MIRZA-OFF-002-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "265.00",
          "currency": "USD",
          "display_amount": "$265.00",
          "amount_in_cents": 26500,
          "compare_at_amount_in_cents": 30475,
          "display_compare_at_amount": "$304.75"
        },
        "original_price": {
          "amount": "265.00",
          "currency": "USD",
          "display_amount": "$265.00",
          "amount_in_cents": 26500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_03",
    "name": "The Kensington Penny Loafer",
    "slug": "office-footwear-03",
    "sku": "MIRZA-OFF-003",
    "description": "Timeless slip-on silhouette in velvety espresso suede with hand-stitched apron detailing.",
    "description_html": "<p>Timeless slip-on silhouette in velvety espresso suede with hand-stitched apron detailing.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Kensington Penny Loafer | Mirza Footwear",
    "meta_description": "Timeless slip-on silhouette in velvety espresso suede with hand-stitched apron detailing.",
    "meta_keywords": "The Kensington Penny Loafer, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-03/5a1ebebf/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_03_1",
      "url": "/products/office-footwear-03/5a1ebebf/card-lg-640.webp",
      "alt": "The Kensington Penny Loafer",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-03/5a1ebebf/zoom-1600.webp",
      "large_url": "/products/office-footwear-03/5a1ebebf/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-03/5a1ebebf/zoom-1600.webp",
      "small_url": "/products/office-footwear-03/5a1ebebf/card-sm-320.webp",
      "mini_url": "/products/office-footwear-03/5a1ebebf/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_03_7",
        "var_office_footwear_03_8",
        "var_office_footwear_03_9",
        "var_office_footwear_03_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_03_1",
        "url": "/products/office-footwear-03/5a1ebebf/card-lg-640.webp",
        "alt": "The Kensington Penny Loafer",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-03/5a1ebebf/zoom-1600.webp",
        "large_url": "/products/office-footwear-03/5a1ebebf/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-03/5a1ebebf/zoom-1600.webp",
        "small_url": "/products/office-footwear-03/5a1ebebf/card-sm-320.webp",
        "mini_url": "/products/office-footwear-03/5a1ebebf/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_03_7",
          "var_office_footwear_03_8",
          "var_office_footwear_03_9",
          "var_office_footwear_03_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-03/5a1ebebf/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAACwAQCdASoQABAABUB8JQAAUmgg0ijAAP0DLkD/QqYy5JKgxP8A2Fyvu936SbC+iq26bJbXNQ6zBhVFBbOWIMv7BNvrJXpncu/OfSiURdJQQ+UZHQWAAA==",
      "dominantColor": "#080808",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-03/5a1ebebf/thumb-160.avif",
          "webp": "/products/office-footwear-03/5a1ebebf/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-03/5a1ebebf/card-sm-320.avif",
          "webp": "/products/office-footwear-03/5a1ebebf/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-03/5a1ebebf/card-480.avif",
          "webp": "/products/office-footwear-03/5a1ebebf/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-03/5a1ebebf/card-lg-640.avif",
          "webp": "/products/office-footwear-03/5a1ebebf/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-03/5a1ebebf/pdp-960.avif",
          "webp": "/products/office-footwear-03/5a1ebebf/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-03/5a1ebebf/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-03/5a1ebebf/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-03/5a1ebebf/zoom-1600.avif",
          "webp": "/products/office-footwear-03/5a1ebebf/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "245.00",
      "currency": "USD",
      "display_amount": "$245.00",
      "amount_in_cents": 24500,
      "compare_at_amount": "281.75",
      "compare_at_amount_in_cents": 28175,
      "display_compare_at_amount": "$281.75"
    },
    "original_price": {
      "amount": "245.00",
      "currency": "USD",
      "display_amount": "$245.00",
      "amount_in_cents": 24500
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_03_8",
    "default_variant": {
      "id": "var_office_footwear_03_8",
      "product_id": "prod_mirza_office_footwear_03",
      "is_master": true,
      "sku": "MIRZA-OFF-003-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "245.00",
        "currency": "USD",
        "display_amount": "$245.00",
        "amount_in_cents": 24500,
        "compare_at_amount_in_cents": 28175,
        "display_compare_at_amount": "$281.75"
      },
      "original_price": {
        "amount": "245.00",
        "currency": "USD",
        "display_amount": "$245.00",
        "amount_in_cents": 24500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_03_7",
        "product_id": "prod_mirza_office_footwear_03",
        "is_master": false,
        "sku": "MIRZA-OFF-003-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "245.00",
          "currency": "USD",
          "display_amount": "$245.00",
          "amount_in_cents": 24500,
          "compare_at_amount_in_cents": 28175,
          "display_compare_at_amount": "$281.75"
        },
        "original_price": {
          "amount": "245.00",
          "currency": "USD",
          "display_amount": "$245.00",
          "amount_in_cents": 24500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_03_8",
        "product_id": "prod_mirza_office_footwear_03",
        "is_master": true,
        "sku": "MIRZA-OFF-003-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "245.00",
          "currency": "USD",
          "display_amount": "$245.00",
          "amount_in_cents": 24500,
          "compare_at_amount_in_cents": 28175,
          "display_compare_at_amount": "$281.75"
        },
        "original_price": {
          "amount": "245.00",
          "currency": "USD",
          "display_amount": "$245.00",
          "amount_in_cents": 24500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_03_9",
        "product_id": "prod_mirza_office_footwear_03",
        "is_master": false,
        "sku": "MIRZA-OFF-003-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "245.00",
          "currency": "USD",
          "display_amount": "$245.00",
          "amount_in_cents": 24500,
          "compare_at_amount_in_cents": 28175,
          "display_compare_at_amount": "$281.75"
        },
        "original_price": {
          "amount": "245.00",
          "currency": "USD",
          "display_amount": "$245.00",
          "amount_in_cents": 24500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_03_10",
        "product_id": "prod_mirza_office_footwear_03",
        "is_master": false,
        "sku": "MIRZA-OFF-003-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "245.00",
          "currency": "USD",
          "display_amount": "$245.00",
          "amount_in_cents": 24500,
          "compare_at_amount_in_cents": 28175,
          "display_compare_at_amount": "$281.75"
        },
        "original_price": {
          "amount": "245.00",
          "currency": "USD",
          "display_amount": "$245.00",
          "amount_in_cents": 24500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_04",
    "name": "The Mayfair Chelsea Boot",
    "slug": "office-footwear-04",
    "sku": "MIRZA-OFF-004",
    "description": "Sleek ankle-high Chelsea boot in supple black calfskin with elasticated gussets and rubber storm welt.",
    "description_html": "<p>Sleek ankle-high Chelsea boot in supple black calfskin with elasticated gussets and rubber storm welt.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Mayfair Chelsea Boot | Mirza Footwear",
    "meta_description": "Sleek ankle-high Chelsea boot in supple black calfskin with elasticated gussets and rubber storm welt.",
    "meta_keywords": "The Mayfair Chelsea Boot, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-04/82f6bb48/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_04_1",
      "url": "/products/office-footwear-04/82f6bb48/card-lg-640.webp",
      "alt": "The Mayfair Chelsea Boot",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-04/82f6bb48/zoom-1600.webp",
      "large_url": "/products/office-footwear-04/82f6bb48/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-04/82f6bb48/zoom-1600.webp",
      "small_url": "/products/office-footwear-04/82f6bb48/card-sm-320.webp",
      "mini_url": "/products/office-footwear-04/82f6bb48/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_04_7",
        "var_office_footwear_04_8",
        "var_office_footwear_04_9",
        "var_office_footwear_04_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_04_1",
        "url": "/products/office-footwear-04/82f6bb48/card-lg-640.webp",
        "alt": "The Mayfair Chelsea Boot",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-04/82f6bb48/zoom-1600.webp",
        "large_url": "/products/office-footwear-04/82f6bb48/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-04/82f6bb48/zoom-1600.webp",
        "small_url": "/products/office-footwear-04/82f6bb48/card-sm-320.webp",
        "mini_url": "/products/office-footwear-04/82f6bb48/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_04_7",
          "var_office_footwear_04_8",
          "var_office_footwear_04_9",
          "var_office_footwear_04_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-04/82f6bb48/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmwAAABXRUJQVlA4IGAAAADQAQCdASoQABAABUB8JYgAAhU690yqgAD+bOTt9fL+HBtH3MzSX447WrZnXDzRSmthW9Ibs6mDQHwlumyuSbvRhBaKxJumS0oVnCSC7FJ6j65DS+HC9qRv4sRzH60/gAA=",
      "dominantColor": "#181818",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-04/82f6bb48/thumb-160.avif",
          "webp": "/products/office-footwear-04/82f6bb48/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-04/82f6bb48/card-sm-320.avif",
          "webp": "/products/office-footwear-04/82f6bb48/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-04/82f6bb48/card-480.avif",
          "webp": "/products/office-footwear-04/82f6bb48/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-04/82f6bb48/card-lg-640.avif",
          "webp": "/products/office-footwear-04/82f6bb48/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-04/82f6bb48/pdp-960.avif",
          "webp": "/products/office-footwear-04/82f6bb48/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-04/82f6bb48/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-04/82f6bb48/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-04/82f6bb48/zoom-1600.avif",
          "webp": "/products/office-footwear-04/82f6bb48/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "320.00",
      "currency": "USD",
      "display_amount": "$320.00",
      "amount_in_cents": 32000,
      "compare_at_amount": "368.00",
      "compare_at_amount_in_cents": 36800,
      "display_compare_at_amount": "$368.00"
    },
    "original_price": {
      "amount": "320.00",
      "currency": "USD",
      "display_amount": "$320.00",
      "amount_in_cents": 32000
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_04_8",
    "default_variant": {
      "id": "var_office_footwear_04_8",
      "product_id": "prod_mirza_office_footwear_04",
      "is_master": true,
      "sku": "MIRZA-OFF-004-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "320.00",
        "currency": "USD",
        "display_amount": "$320.00",
        "amount_in_cents": 32000,
        "compare_at_amount_in_cents": 36800,
        "display_compare_at_amount": "$368.00"
      },
      "original_price": {
        "amount": "320.00",
        "currency": "USD",
        "display_amount": "$320.00",
        "amount_in_cents": 32000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_04_7",
        "product_id": "prod_mirza_office_footwear_04",
        "is_master": false,
        "sku": "MIRZA-OFF-004-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "320.00",
          "currency": "USD",
          "display_amount": "$320.00",
          "amount_in_cents": 32000,
          "compare_at_amount_in_cents": 36800,
          "display_compare_at_amount": "$368.00"
        },
        "original_price": {
          "amount": "320.00",
          "currency": "USD",
          "display_amount": "$320.00",
          "amount_in_cents": 32000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_04_8",
        "product_id": "prod_mirza_office_footwear_04",
        "is_master": true,
        "sku": "MIRZA-OFF-004-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "320.00",
          "currency": "USD",
          "display_amount": "$320.00",
          "amount_in_cents": 32000,
          "compare_at_amount_in_cents": 36800,
          "display_compare_at_amount": "$368.00"
        },
        "original_price": {
          "amount": "320.00",
          "currency": "USD",
          "display_amount": "$320.00",
          "amount_in_cents": 32000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_04_9",
        "product_id": "prod_mirza_office_footwear_04",
        "is_master": false,
        "sku": "MIRZA-OFF-004-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "320.00",
          "currency": "USD",
          "display_amount": "$320.00",
          "amount_in_cents": 32000,
          "compare_at_amount_in_cents": 36800,
          "display_compare_at_amount": "$368.00"
        },
        "original_price": {
          "amount": "320.00",
          "currency": "USD",
          "display_amount": "$320.00",
          "amount_in_cents": 32000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_04_10",
        "product_id": "prod_mirza_office_footwear_04",
        "is_master": false,
        "sku": "MIRZA-OFF-004-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "320.00",
          "currency": "USD",
          "display_amount": "$320.00",
          "amount_in_cents": 32000,
          "compare_at_amount_in_cents": 36800,
          "display_compare_at_amount": "$368.00"
        },
        "original_price": {
          "amount": "320.00",
          "currency": "USD",
          "display_amount": "$320.00",
          "amount_in_cents": 32000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_05",
    "name": "The Westminster Double Monk Strap",
    "slug": "office-footwear-05",
    "sku": "MIRZA-OFF-005",
    "description": "Elegant double buckle monk strap featuring hand-burnished burgundy leather and brass hardware.",
    "description_html": "<p>Elegant double buckle monk strap featuring hand-burnished burgundy leather and brass hardware.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Westminster Double Monk Strap | Mirza Footwear",
    "meta_description": "Elegant double buckle monk strap featuring hand-burnished burgundy leather and brass hardware.",
    "meta_keywords": "The Westminster Double Monk Strap, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-05/5029185f/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_05_1",
      "url": "/products/office-footwear-05/5029185f/card-lg-640.webp",
      "alt": "The Westminster Double Monk Strap",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-05/5029185f/zoom-1600.webp",
      "large_url": "/products/office-footwear-05/5029185f/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-05/5029185f/zoom-1600.webp",
      "small_url": "/products/office-footwear-05/5029185f/card-sm-320.webp",
      "mini_url": "/products/office-footwear-05/5029185f/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_05_7",
        "var_office_footwear_05_8",
        "var_office_footwear_05_9",
        "var_office_footwear_05_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_05_1",
        "url": "/products/office-footwear-05/5029185f/card-lg-640.webp",
        "alt": "The Westminster Double Monk Strap",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-05/5029185f/zoom-1600.webp",
        "large_url": "/products/office-footwear-05/5029185f/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-05/5029185f/zoom-1600.webp",
        "small_url": "/products/office-footwear-05/5029185f/card-sm-320.webp",
        "mini_url": "/products/office-footwear-05/5029185f/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_05_7",
          "var_office_footwear_05_8",
          "var_office_footwear_05_9",
          "var_office_footwear_05_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-05/5029185f/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRnIAAABXRUJQVlA4IGYAAADwAQCdASoQABAABUB8JZwAD5IOLwD4eAAA4n/EEfS6NtH0yQ3FM0y0UieaO+x8QFftJNJV1Dm1j63I5KjhClKNPMKWlujQFpw1omaK6qiy8kY/EETotSP4KV/gj4G2uxP8BuAAAAA=",
      "dominantColor": "#181818",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-05/5029185f/thumb-160.avif",
          "webp": "/products/office-footwear-05/5029185f/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-05/5029185f/card-sm-320.avif",
          "webp": "/products/office-footwear-05/5029185f/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-05/5029185f/card-480.avif",
          "webp": "/products/office-footwear-05/5029185f/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-05/5029185f/card-lg-640.avif",
          "webp": "/products/office-footwear-05/5029185f/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-05/5029185f/pdp-960.avif",
          "webp": "/products/office-footwear-05/5029185f/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-05/5029185f/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-05/5029185f/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-05/5029185f/zoom-1600.avif",
          "webp": "/products/office-footwear-05/5029185f/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "295.00",
      "currency": "USD",
      "display_amount": "$295.00",
      "amount_in_cents": 29500,
      "compare_at_amount": "339.25",
      "compare_at_amount_in_cents": 33925,
      "display_compare_at_amount": "$339.25"
    },
    "original_price": {
      "amount": "295.00",
      "currency": "USD",
      "display_amount": "$295.00",
      "amount_in_cents": 29500
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_05_8",
    "default_variant": {
      "id": "var_office_footwear_05_8",
      "product_id": "prod_mirza_office_footwear_05",
      "is_master": true,
      "sku": "MIRZA-OFF-005-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "295.00",
        "currency": "USD",
        "display_amount": "$295.00",
        "amount_in_cents": 29500,
        "compare_at_amount_in_cents": 33925,
        "display_compare_at_amount": "$339.25"
      },
      "original_price": {
        "amount": "295.00",
        "currency": "USD",
        "display_amount": "$295.00",
        "amount_in_cents": 29500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_05_7",
        "product_id": "prod_mirza_office_footwear_05",
        "is_master": false,
        "sku": "MIRZA-OFF-005-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "295.00",
          "currency": "USD",
          "display_amount": "$295.00",
          "amount_in_cents": 29500,
          "compare_at_amount_in_cents": 33925,
          "display_compare_at_amount": "$339.25"
        },
        "original_price": {
          "amount": "295.00",
          "currency": "USD",
          "display_amount": "$295.00",
          "amount_in_cents": 29500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_05_8",
        "product_id": "prod_mirza_office_footwear_05",
        "is_master": true,
        "sku": "MIRZA-OFF-005-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "295.00",
          "currency": "USD",
          "display_amount": "$295.00",
          "amount_in_cents": 29500,
          "compare_at_amount_in_cents": 33925,
          "display_compare_at_amount": "$339.25"
        },
        "original_price": {
          "amount": "295.00",
          "currency": "USD",
          "display_amount": "$295.00",
          "amount_in_cents": 29500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_05_9",
        "product_id": "prod_mirza_office_footwear_05",
        "is_master": false,
        "sku": "MIRZA-OFF-005-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "295.00",
          "currency": "USD",
          "display_amount": "$295.00",
          "amount_in_cents": 29500,
          "compare_at_amount_in_cents": 33925,
          "display_compare_at_amount": "$339.25"
        },
        "original_price": {
          "amount": "295.00",
          "currency": "USD",
          "display_amount": "$295.00",
          "amount_in_cents": 29500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_05_10",
        "product_id": "prod_mirza_office_footwear_05",
        "is_master": false,
        "sku": "MIRZA-OFF-005-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "295.00",
          "currency": "USD",
          "display_amount": "$295.00",
          "amount_in_cents": 29500,
          "compare_at_amount_in_cents": 33925,
          "display_compare_at_amount": "$339.25"
        },
        "original_price": {
          "amount": "295.00",
          "currency": "USD",
          "display_amount": "$295.00",
          "amount_in_cents": 29500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_06",
    "name": "The Belgravia Cap-Toe Oxford",
    "slug": "office-footwear-06",
    "sku": "MIRZA-OFF-006",
    "description": "Quintessential formal cap-toe oxford in deep black box calf leather, perfect for executive attire.",
    "description_html": "<p>Quintessential formal cap-toe oxford in deep black box calf leather, perfect for executive attire.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Belgravia Cap-Toe Oxford | Mirza Footwear",
    "meta_description": "Quintessential formal cap-toe oxford in deep black box calf leather, perfect for executive attire.",
    "meta_keywords": "The Belgravia Cap-Toe Oxford, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-06/f057e062/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_06_1",
      "url": "/products/office-footwear-06/f057e062/card-lg-640.webp",
      "alt": "The Belgravia Cap-Toe Oxford",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-06/f057e062/zoom-1600.webp",
      "large_url": "/products/office-footwear-06/f057e062/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-06/f057e062/zoom-1600.webp",
      "small_url": "/products/office-footwear-06/f057e062/card-sm-320.webp",
      "mini_url": "/products/office-footwear-06/f057e062/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_06_7",
        "var_office_footwear_06_8",
        "var_office_footwear_06_9",
        "var_office_footwear_06_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_06_1",
        "url": "/products/office-footwear-06/f057e062/card-lg-640.webp",
        "alt": "The Belgravia Cap-Toe Oxford",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-06/f057e062/zoom-1600.webp",
        "large_url": "/products/office-footwear-06/f057e062/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-06/f057e062/zoom-1600.webp",
        "small_url": "/products/office-footwear-06/f057e062/card-sm-320.webp",
        "mini_url": "/products/office-footwear-06/f057e062/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_06_7",
          "var_office_footwear_06_8",
          "var_office_footwear_06_9",
          "var_office_footwear_06_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-06/f057e062/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAADQAQCdASoQABAABUB8JZQAAn/T3qvTsAD+nA027KR0r0Hso0A4vlYwoQVYxpAi5tT3RNnHERRsIzydIwThvIuyTRVSQEBonTD4u4XNZmaPndozT0Aw4AAA",
      "dominantColor": "#282838",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-06/f057e062/thumb-160.avif",
          "webp": "/products/office-footwear-06/f057e062/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-06/f057e062/card-sm-320.avif",
          "webp": "/products/office-footwear-06/f057e062/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-06/f057e062/card-480.avif",
          "webp": "/products/office-footwear-06/f057e062/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-06/f057e062/card-lg-640.avif",
          "webp": "/products/office-footwear-06/f057e062/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-06/f057e062/pdp-960.avif",
          "webp": "/products/office-footwear-06/f057e062/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-06/f057e062/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-06/f057e062/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-06/f057e062/zoom-1600.avif",
          "webp": "/products/office-footwear-06/f057e062/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "275.00",
      "currency": "USD",
      "display_amount": "$275.00",
      "amount_in_cents": 27500,
      "compare_at_amount": "316.25",
      "compare_at_amount_in_cents": 31625,
      "display_compare_at_amount": "$316.25"
    },
    "original_price": {
      "amount": "275.00",
      "currency": "USD",
      "display_amount": "$275.00",
      "amount_in_cents": 27500
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_06_8",
    "default_variant": {
      "id": "var_office_footwear_06_8",
      "product_id": "prod_mirza_office_footwear_06",
      "is_master": true,
      "sku": "MIRZA-OFF-006-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "275.00",
        "currency": "USD",
        "display_amount": "$275.00",
        "amount_in_cents": 27500,
        "compare_at_amount_in_cents": 31625,
        "display_compare_at_amount": "$316.25"
      },
      "original_price": {
        "amount": "275.00",
        "currency": "USD",
        "display_amount": "$275.00",
        "amount_in_cents": 27500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_06_7",
        "product_id": "prod_mirza_office_footwear_06",
        "is_master": false,
        "sku": "MIRZA-OFF-006-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "275.00",
          "currency": "USD",
          "display_amount": "$275.00",
          "amount_in_cents": 27500,
          "compare_at_amount_in_cents": 31625,
          "display_compare_at_amount": "$316.25"
        },
        "original_price": {
          "amount": "275.00",
          "currency": "USD",
          "display_amount": "$275.00",
          "amount_in_cents": 27500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_06_8",
        "product_id": "prod_mirza_office_footwear_06",
        "is_master": true,
        "sku": "MIRZA-OFF-006-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "275.00",
          "currency": "USD",
          "display_amount": "$275.00",
          "amount_in_cents": 27500,
          "compare_at_amount_in_cents": 31625,
          "display_compare_at_amount": "$316.25"
        },
        "original_price": {
          "amount": "275.00",
          "currency": "USD",
          "display_amount": "$275.00",
          "amount_in_cents": 27500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_06_9",
        "product_id": "prod_mirza_office_footwear_06",
        "is_master": false,
        "sku": "MIRZA-OFF-006-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "275.00",
          "currency": "USD",
          "display_amount": "$275.00",
          "amount_in_cents": 27500,
          "compare_at_amount_in_cents": 31625,
          "display_compare_at_amount": "$316.25"
        },
        "original_price": {
          "amount": "275.00",
          "currency": "USD",
          "display_amount": "$275.00",
          "amount_in_cents": 27500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_06_10",
        "product_id": "prod_mirza_office_footwear_06",
        "is_master": false,
        "sku": "MIRZA-OFF-006-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "275.00",
          "currency": "USD",
          "display_amount": "$275.00",
          "amount_in_cents": 27500,
          "compare_at_amount_in_cents": 31625,
          "display_compare_at_amount": "$316.25"
        },
        "original_price": {
          "amount": "275.00",
          "currency": "USD",
          "display_amount": "$275.00",
          "amount_in_cents": 27500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_07",
    "name": "The Piccadilly Tassel Loafer",
    "slug": "office-footwear-07",
    "sku": "MIRZA-OFF-007",
    "description": "Refined tassel loafer crafted from supple dark oak calfskin with a Goodyear-welted leather sole.",
    "description_html": "<p>Refined tassel loafer crafted from supple dark oak calfskin with a Goodyear-welted leather sole.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Piccadilly Tassel Loafer | Mirza Footwear",
    "meta_description": "Refined tassel loafer crafted from supple dark oak calfskin with a Goodyear-welted leather sole.",
    "meta_keywords": "The Piccadilly Tassel Loafer, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-07/8c139d8f/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_07_1",
      "url": "/products/office-footwear-07/8c139d8f/card-lg-640.webp",
      "alt": "The Piccadilly Tassel Loafer",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-07/8c139d8f/zoom-1600.webp",
      "large_url": "/products/office-footwear-07/8c139d8f/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-07/8c139d8f/zoom-1600.webp",
      "small_url": "/products/office-footwear-07/8c139d8f/card-sm-320.webp",
      "mini_url": "/products/office-footwear-07/8c139d8f/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_07_7",
        "var_office_footwear_07_8",
        "var_office_footwear_07_9",
        "var_office_footwear_07_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_07_1",
        "url": "/products/office-footwear-07/8c139d8f/card-lg-640.webp",
        "alt": "The Piccadilly Tassel Loafer",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-07/8c139d8f/zoom-1600.webp",
        "large_url": "/products/office-footwear-07/8c139d8f/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-07/8c139d8f/zoom-1600.webp",
        "small_url": "/products/office-footwear-07/8c139d8f/card-sm-320.webp",
        "mini_url": "/products/office-footwear-07/8c139d8f/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_07_7",
          "var_office_footwear_07_8",
          "var_office_footwear_07_9",
          "var_office_footwear_07_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-07/8c139d8f/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAADwAQCdASoQABAABUB8JZwAAvqpc8Cyr4AA/uGm99tcszRFeFrYP8aS6e95UmiDnb8f71xB3fzfe83pd+J0nqAphvu8EyzCHuKNkhSENihAAA==",
      "dominantColor": "#282838",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-07/8c139d8f/thumb-160.avif",
          "webp": "/products/office-footwear-07/8c139d8f/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-07/8c139d8f/card-sm-320.avif",
          "webp": "/products/office-footwear-07/8c139d8f/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-07/8c139d8f/card-480.avif",
          "webp": "/products/office-footwear-07/8c139d8f/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-07/8c139d8f/card-lg-640.avif",
          "webp": "/products/office-footwear-07/8c139d8f/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-07/8c139d8f/pdp-960.avif",
          "webp": "/products/office-footwear-07/8c139d8f/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-07/8c139d8f/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-07/8c139d8f/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-07/8c139d8f/zoom-1600.avif",
          "webp": "/products/office-footwear-07/8c139d8f/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "255.00",
      "currency": "USD",
      "display_amount": "$255.00",
      "amount_in_cents": 25500,
      "compare_at_amount": "293.25",
      "compare_at_amount_in_cents": 29325,
      "display_compare_at_amount": "$293.25"
    },
    "original_price": {
      "amount": "255.00",
      "currency": "USD",
      "display_amount": "$255.00",
      "amount_in_cents": 25500
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_07_8",
    "default_variant": {
      "id": "var_office_footwear_07_8",
      "product_id": "prod_mirza_office_footwear_07",
      "is_master": true,
      "sku": "MIRZA-OFF-007-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "255.00",
        "currency": "USD",
        "display_amount": "$255.00",
        "amount_in_cents": 25500,
        "compare_at_amount_in_cents": 29325,
        "display_compare_at_amount": "$293.25"
      },
      "original_price": {
        "amount": "255.00",
        "currency": "USD",
        "display_amount": "$255.00",
        "amount_in_cents": 25500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_07_7",
        "product_id": "prod_mirza_office_footwear_07",
        "is_master": false,
        "sku": "MIRZA-OFF-007-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "255.00",
          "currency": "USD",
          "display_amount": "$255.00",
          "amount_in_cents": 25500,
          "compare_at_amount_in_cents": 29325,
          "display_compare_at_amount": "$293.25"
        },
        "original_price": {
          "amount": "255.00",
          "currency": "USD",
          "display_amount": "$255.00",
          "amount_in_cents": 25500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_07_8",
        "product_id": "prod_mirza_office_footwear_07",
        "is_master": true,
        "sku": "MIRZA-OFF-007-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "255.00",
          "currency": "USD",
          "display_amount": "$255.00",
          "amount_in_cents": 25500,
          "compare_at_amount_in_cents": 29325,
          "display_compare_at_amount": "$293.25"
        },
        "original_price": {
          "amount": "255.00",
          "currency": "USD",
          "display_amount": "$255.00",
          "amount_in_cents": 25500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_07_9",
        "product_id": "prod_mirza_office_footwear_07",
        "is_master": false,
        "sku": "MIRZA-OFF-007-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "255.00",
          "currency": "USD",
          "display_amount": "$255.00",
          "amount_in_cents": 25500,
          "compare_at_amount_in_cents": 29325,
          "display_compare_at_amount": "$293.25"
        },
        "original_price": {
          "amount": "255.00",
          "currency": "USD",
          "display_amount": "$255.00",
          "amount_in_cents": 25500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_07_10",
        "product_id": "prod_mirza_office_footwear_07",
        "is_master": false,
        "sku": "MIRZA-OFF-007-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "255.00",
          "currency": "USD",
          "display_amount": "$255.00",
          "amount_in_cents": 25500,
          "compare_at_amount_in_cents": 29325,
          "display_compare_at_amount": "$293.25"
        },
        "original_price": {
          "amount": "255.00",
          "currency": "USD",
          "display_amount": "$255.00",
          "amount_in_cents": 25500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_08",
    "name": "The St. James Quarter Brogue",
    "slug": "office-footwear-08",
    "sku": "MIRZA-OFF-008",
    "description": "Sophisticated dress shoe featuring subtle toe-cap perforations and hand-waxed finishing.",
    "description_html": "<p>Sophisticated dress shoe featuring subtle toe-cap perforations and hand-waxed finishing.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The St. James Quarter Brogue | Mirza Footwear",
    "meta_description": "Sophisticated dress shoe featuring subtle toe-cap perforations and hand-waxed finishing.",
    "meta_keywords": "The St. James Quarter Brogue, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-08/cd53a411/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_08_1",
      "url": "/products/office-footwear-08/cd53a411/card-lg-640.webp",
      "alt": "The St. James Quarter Brogue",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-08/cd53a411/zoom-1600.webp",
      "large_url": "/products/office-footwear-08/cd53a411/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-08/cd53a411/zoom-1600.webp",
      "small_url": "/products/office-footwear-08/cd53a411/card-sm-320.webp",
      "mini_url": "/products/office-footwear-08/cd53a411/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_08_7",
        "var_office_footwear_08_8",
        "var_office_footwear_08_9",
        "var_office_footwear_08_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_08_1",
        "url": "/products/office-footwear-08/cd53a411/card-lg-640.webp",
        "alt": "The St. James Quarter Brogue",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-08/cd53a411/zoom-1600.webp",
        "large_url": "/products/office-footwear-08/cd53a411/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-08/cd53a411/zoom-1600.webp",
        "small_url": "/products/office-footwear-08/cd53a411/card-sm-320.webp",
        "mini_url": "/products/office-footwear-08/cd53a411/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_08_7",
          "var_office_footwear_08_8",
          "var_office_footwear_08_9",
          "var_office_footwear_08_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-08/cd53a411/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAADQAQCdASoQABAABUB8JZQAAsdB6VKwwADOP9FB/j8KKBA+wkvUtjc/3HVfwr4N/ygcxfvFTFa4aYvugr3v4KrHrsE+06g4AAA=",
      "dominantColor": "#080808",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-08/cd53a411/thumb-160.avif",
          "webp": "/products/office-footwear-08/cd53a411/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-08/cd53a411/card-sm-320.avif",
          "webp": "/products/office-footwear-08/cd53a411/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-08/cd53a411/card-480.avif",
          "webp": "/products/office-footwear-08/cd53a411/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-08/cd53a411/card-lg-640.avif",
          "webp": "/products/office-footwear-08/cd53a411/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-08/cd53a411/pdp-960.avif",
          "webp": "/products/office-footwear-08/cd53a411/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-08/cd53a411/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-08/cd53a411/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-08/cd53a411/zoom-1600.avif",
          "webp": "/products/office-footwear-08/cd53a411/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "280.00",
      "currency": "USD",
      "display_amount": "$280.00",
      "amount_in_cents": 28000,
      "compare_at_amount": "322.00",
      "compare_at_amount_in_cents": 32200,
      "display_compare_at_amount": "$322.00"
    },
    "original_price": {
      "amount": "280.00",
      "currency": "USD",
      "display_amount": "$280.00",
      "amount_in_cents": 28000
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_08_8",
    "default_variant": {
      "id": "var_office_footwear_08_8",
      "product_id": "prod_mirza_office_footwear_08",
      "is_master": true,
      "sku": "MIRZA-OFF-008-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "280.00",
        "currency": "USD",
        "display_amount": "$280.00",
        "amount_in_cents": 28000,
        "compare_at_amount_in_cents": 32200,
        "display_compare_at_amount": "$322.00"
      },
      "original_price": {
        "amount": "280.00",
        "currency": "USD",
        "display_amount": "$280.00",
        "amount_in_cents": 28000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_08_7",
        "product_id": "prod_mirza_office_footwear_08",
        "is_master": false,
        "sku": "MIRZA-OFF-008-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "280.00",
          "currency": "USD",
          "display_amount": "$280.00",
          "amount_in_cents": 28000,
          "compare_at_amount_in_cents": 32200,
          "display_compare_at_amount": "$322.00"
        },
        "original_price": {
          "amount": "280.00",
          "currency": "USD",
          "display_amount": "$280.00",
          "amount_in_cents": 28000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_08_8",
        "product_id": "prod_mirza_office_footwear_08",
        "is_master": true,
        "sku": "MIRZA-OFF-008-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "280.00",
          "currency": "USD",
          "display_amount": "$280.00",
          "amount_in_cents": 28000,
          "compare_at_amount_in_cents": 32200,
          "display_compare_at_amount": "$322.00"
        },
        "original_price": {
          "amount": "280.00",
          "currency": "USD",
          "display_amount": "$280.00",
          "amount_in_cents": 28000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_08_9",
        "product_id": "prod_mirza_office_footwear_08",
        "is_master": false,
        "sku": "MIRZA-OFF-008-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "280.00",
          "currency": "USD",
          "display_amount": "$280.00",
          "amount_in_cents": 28000,
          "compare_at_amount_in_cents": 32200,
          "display_compare_at_amount": "$322.00"
        },
        "original_price": {
          "amount": "280.00",
          "currency": "USD",
          "display_amount": "$280.00",
          "amount_in_cents": 28000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_08_10",
        "product_id": "prod_mirza_office_footwear_08",
        "is_master": false,
        "sku": "MIRZA-OFF-008-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "280.00",
          "currency": "USD",
          "display_amount": "$280.00",
          "amount_in_cents": 28000,
          "compare_at_amount_in_cents": 32200,
          "display_compare_at_amount": "$322.00"
        },
        "original_price": {
          "amount": "280.00",
          "currency": "USD",
          "display_amount": "$280.00",
          "amount_in_cents": 28000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_09",
    "name": "The Mayfair Chukka Boot",
    "slug": "office-footwear-09",
    "sku": "MIRZA-OFF-009",
    "description": "Three-eyelet ankle boot in water-resistant suede with a lightweight studded rubber sole.",
    "description_html": "<p>Three-eyelet ankle boot in water-resistant suede with a lightweight studded rubber sole.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Mayfair Chukka Boot | Mirza Footwear",
    "meta_description": "Three-eyelet ankle boot in water-resistant suede with a lightweight studded rubber sole.",
    "meta_keywords": "The Mayfair Chukka Boot, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-09/1221e726/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_09_1",
      "url": "/products/office-footwear-09/1221e726/card-lg-640.webp",
      "alt": "The Mayfair Chukka Boot",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-09/1221e726/zoom-1600.webp",
      "large_url": "/products/office-footwear-09/1221e726/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-09/1221e726/zoom-1600.webp",
      "small_url": "/products/office-footwear-09/1221e726/card-sm-320.webp",
      "mini_url": "/products/office-footwear-09/1221e726/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_09_7",
        "var_office_footwear_09_8",
        "var_office_footwear_09_9",
        "var_office_footwear_09_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_09_1",
        "url": "/products/office-footwear-09/1221e726/card-lg-640.webp",
        "alt": "The Mayfair Chukka Boot",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-09/1221e726/zoom-1600.webp",
        "large_url": "/products/office-footwear-09/1221e726/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-09/1221e726/zoom-1600.webp",
        "small_url": "/products/office-footwear-09/1221e726/card-sm-320.webp",
        "mini_url": "/products/office-footwear-09/1221e726/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_09_7",
          "var_office_footwear_09_8",
          "var_office_footwear_09_9",
          "var_office_footwear_09_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-09/1221e726/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAAAQAgCdASoQABAABUB8JYwAAieyg4R5P894AP6cDTbvkLtOBkuMImGVMVuCv75LotxPGiCM946BQ34a2qXwKXvZJSdc8V071CxAVjPS9q78ByfCgAA=",
      "dominantColor": "#c8e8f8",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-09/1221e726/thumb-160.avif",
          "webp": "/products/office-footwear-09/1221e726/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-09/1221e726/card-sm-320.avif",
          "webp": "/products/office-footwear-09/1221e726/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-09/1221e726/card-480.avif",
          "webp": "/products/office-footwear-09/1221e726/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-09/1221e726/card-lg-640.avif",
          "webp": "/products/office-footwear-09/1221e726/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-09/1221e726/pdp-960.avif",
          "webp": "/products/office-footwear-09/1221e726/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-09/1221e726/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-09/1221e726/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-09/1221e726/zoom-1600.avif",
          "webp": "/products/office-footwear-09/1221e726/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "290.00",
      "currency": "USD",
      "display_amount": "$290.00",
      "amount_in_cents": 29000,
      "compare_at_amount": "333.50",
      "compare_at_amount_in_cents": 33350,
      "display_compare_at_amount": "$333.50"
    },
    "original_price": {
      "amount": "290.00",
      "currency": "USD",
      "display_amount": "$290.00",
      "amount_in_cents": 29000
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_09_8",
    "default_variant": {
      "id": "var_office_footwear_09_8",
      "product_id": "prod_mirza_office_footwear_09",
      "is_master": true,
      "sku": "MIRZA-OFF-009-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "290.00",
        "currency": "USD",
        "display_amount": "$290.00",
        "amount_in_cents": 29000,
        "compare_at_amount_in_cents": 33350,
        "display_compare_at_amount": "$333.50"
      },
      "original_price": {
        "amount": "290.00",
        "currency": "USD",
        "display_amount": "$290.00",
        "amount_in_cents": 29000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_09_7",
        "product_id": "prod_mirza_office_footwear_09",
        "is_master": false,
        "sku": "MIRZA-OFF-009-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "290.00",
          "currency": "USD",
          "display_amount": "$290.00",
          "amount_in_cents": 29000,
          "compare_at_amount_in_cents": 33350,
          "display_compare_at_amount": "$333.50"
        },
        "original_price": {
          "amount": "290.00",
          "currency": "USD",
          "display_amount": "$290.00",
          "amount_in_cents": 29000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_09_8",
        "product_id": "prod_mirza_office_footwear_09",
        "is_master": true,
        "sku": "MIRZA-OFF-009-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "290.00",
          "currency": "USD",
          "display_amount": "$290.00",
          "amount_in_cents": 29000,
          "compare_at_amount_in_cents": 33350,
          "display_compare_at_amount": "$333.50"
        },
        "original_price": {
          "amount": "290.00",
          "currency": "USD",
          "display_amount": "$290.00",
          "amount_in_cents": 29000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_09_9",
        "product_id": "prod_mirza_office_footwear_09",
        "is_master": false,
        "sku": "MIRZA-OFF-009-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "290.00",
          "currency": "USD",
          "display_amount": "$290.00",
          "amount_in_cents": 29000,
          "compare_at_amount_in_cents": 33350,
          "display_compare_at_amount": "$333.50"
        },
        "original_price": {
          "amount": "290.00",
          "currency": "USD",
          "display_amount": "$290.00",
          "amount_in_cents": 29000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_09_10",
        "product_id": "prod_mirza_office_footwear_09",
        "is_master": false,
        "sku": "MIRZA-OFF-009-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "290.00",
          "currency": "USD",
          "display_amount": "$290.00",
          "amount_in_cents": 29000,
          "compare_at_amount_in_cents": 33350,
          "display_compare_at_amount": "$333.50"
        },
        "original_price": {
          "amount": "290.00",
          "currency": "USD",
          "display_amount": "$290.00",
          "amount_in_cents": 29000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_10",
    "name": "The Royal Single Monk Strap",
    "slug": "office-footwear-10",
    "sku": "MIRZA-OFF-010",
    "description": "Minimalist single-buckle monk strap offering a streamlined silhouette for modern suiting.",
    "description_html": "<p>Minimalist single-buckle monk strap offering a streamlined silhouette for modern suiting.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Royal Single Monk Strap | Mirza Footwear",
    "meta_description": "Minimalist single-buckle monk strap offering a streamlined silhouette for modern suiting.",
    "meta_keywords": "The Royal Single Monk Strap, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-10/698f591b/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_10_1",
      "url": "/products/office-footwear-10/698f591b/card-lg-640.webp",
      "alt": "The Royal Single Monk Strap",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-10/698f591b/zoom-1600.webp",
      "large_url": "/products/office-footwear-10/698f591b/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-10/698f591b/zoom-1600.webp",
      "small_url": "/products/office-footwear-10/698f591b/card-sm-320.webp",
      "mini_url": "/products/office-footwear-10/698f591b/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_10_7",
        "var_office_footwear_10_8",
        "var_office_footwear_10_9",
        "var_office_footwear_10_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_10_1",
        "url": "/products/office-footwear-10/698f591b/card-lg-640.webp",
        "alt": "The Royal Single Monk Strap",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-10/698f591b/zoom-1600.webp",
        "large_url": "/products/office-footwear-10/698f591b/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-10/698f591b/zoom-1600.webp",
        "small_url": "/products/office-footwear-10/698f591b/card-sm-320.webp",
        "mini_url": "/products/office-footwear-10/698f591b/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_10_7",
          "var_office_footwear_10_8",
          "var_office_footwear_10_9",
          "var_office_footwear_10_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-10/698f591b/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAAAQAgCdASoQABAABUB8JYwC7AEOJt/yLemAAN5nuYL1Y6/wBT1SW7OL7to4QqLrU/FtO2vOKAz4wuw/YCqgvF/wc3v4ke/5ANL0+X/iHyc9c8Y/jAKB7AAA",
      "dominantColor": "#b8c8d8",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-10/698f591b/thumb-160.avif",
          "webp": "/products/office-footwear-10/698f591b/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-10/698f591b/card-sm-320.avif",
          "webp": "/products/office-footwear-10/698f591b/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-10/698f591b/card-480.avif",
          "webp": "/products/office-footwear-10/698f591b/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-10/698f591b/card-lg-640.avif",
          "webp": "/products/office-footwear-10/698f591b/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-10/698f591b/pdp-960.avif",
          "webp": "/products/office-footwear-10/698f591b/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-10/698f591b/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-10/698f591b/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-10/698f591b/zoom-1600.avif",
          "webp": "/products/office-footwear-10/698f591b/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "270.00",
      "currency": "USD",
      "display_amount": "$270.00",
      "amount_in_cents": 27000,
      "compare_at_amount": "310.50",
      "compare_at_amount_in_cents": 31050,
      "display_compare_at_amount": "$310.50"
    },
    "original_price": {
      "amount": "270.00",
      "currency": "USD",
      "display_amount": "$270.00",
      "amount_in_cents": 27000
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_10_8",
    "default_variant": {
      "id": "var_office_footwear_10_8",
      "product_id": "prod_mirza_office_footwear_10",
      "is_master": true,
      "sku": "MIRZA-OFF-010-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "270.00",
        "currency": "USD",
        "display_amount": "$270.00",
        "amount_in_cents": 27000,
        "compare_at_amount_in_cents": 31050,
        "display_compare_at_amount": "$310.50"
      },
      "original_price": {
        "amount": "270.00",
        "currency": "USD",
        "display_amount": "$270.00",
        "amount_in_cents": 27000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_10_7",
        "product_id": "prod_mirza_office_footwear_10",
        "is_master": false,
        "sku": "MIRZA-OFF-010-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "270.00",
          "currency": "USD",
          "display_amount": "$270.00",
          "amount_in_cents": 27000,
          "compare_at_amount_in_cents": 31050,
          "display_compare_at_amount": "$310.50"
        },
        "original_price": {
          "amount": "270.00",
          "currency": "USD",
          "display_amount": "$270.00",
          "amount_in_cents": 27000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_10_8",
        "product_id": "prod_mirza_office_footwear_10",
        "is_master": true,
        "sku": "MIRZA-OFF-010-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "270.00",
          "currency": "USD",
          "display_amount": "$270.00",
          "amount_in_cents": 27000,
          "compare_at_amount_in_cents": 31050,
          "display_compare_at_amount": "$310.50"
        },
        "original_price": {
          "amount": "270.00",
          "currency": "USD",
          "display_amount": "$270.00",
          "amount_in_cents": 27000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_10_9",
        "product_id": "prod_mirza_office_footwear_10",
        "is_master": false,
        "sku": "MIRZA-OFF-010-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "270.00",
          "currency": "USD",
          "display_amount": "$270.00",
          "amount_in_cents": 27000,
          "compare_at_amount_in_cents": 31050,
          "display_compare_at_amount": "$310.50"
        },
        "original_price": {
          "amount": "270.00",
          "currency": "USD",
          "display_amount": "$270.00",
          "amount_in_cents": 27000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_10_10",
        "product_id": "prod_mirza_office_footwear_10",
        "is_master": false,
        "sku": "MIRZA-OFF-010-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "270.00",
          "currency": "USD",
          "display_amount": "$270.00",
          "amount_in_cents": 27000,
          "compare_at_amount_in_cents": 31050,
          "display_compare_at_amount": "$310.50"
        },
        "original_price": {
          "amount": "270.00",
          "currency": "USD",
          "display_amount": "$270.00",
          "amount_in_cents": 27000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_11",
    "name": "The Savoy Medallion Oxford",
    "slug": "office-footwear-11",
    "sku": "MIRZA-OFF-011",
    "description": "Distinguished oxford featuring an artisanal punched medallion toe and hand-burnished tan patina.",
    "description_html": "<p>Distinguished oxford featuring an artisanal punched medallion toe and hand-burnished tan patina.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Savoy Medallion Oxford | Mirza Footwear",
    "meta_description": "Distinguished oxford featuring an artisanal punched medallion toe and hand-burnished tan patina.",
    "meta_keywords": "The Savoy Medallion Oxford, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-11/204a6fc9/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_11_1",
      "url": "/products/office-footwear-11/204a6fc9/card-lg-640.webp",
      "alt": "The Savoy Medallion Oxford",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-11/204a6fc9/zoom-1600.webp",
      "large_url": "/products/office-footwear-11/204a6fc9/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-11/204a6fc9/zoom-1600.webp",
      "small_url": "/products/office-footwear-11/204a6fc9/card-sm-320.webp",
      "mini_url": "/products/office-footwear-11/204a6fc9/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_11_7",
        "var_office_footwear_11_8",
        "var_office_footwear_11_9",
        "var_office_footwear_11_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_11_1",
        "url": "/products/office-footwear-11/204a6fc9/card-lg-640.webp",
        "alt": "The Savoy Medallion Oxford",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-11/204a6fc9/zoom-1600.webp",
        "large_url": "/products/office-footwear-11/204a6fc9/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-11/204a6fc9/zoom-1600.webp",
        "small_url": "/products/office-footwear-11/204a6fc9/card-sm-320.webp",
        "mini_url": "/products/office-footwear-11/204a6fc9/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_11_7",
          "var_office_footwear_11_8",
          "var_office_footwear_11_9",
          "var_office_footwear_11_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-11/204a6fc9/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAADwAQCdASoQABAABUB8JYwAAq8vBUOs8gAA/guQafYQWjrnJ3ZGsImCfvcv048Z+nZh8tUhHYCy4fZd1aHVCtChzcxQcANqIIXTZJXm8Uf9UCOOgAA=",
      "dominantColor": "#382828",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-11/204a6fc9/thumb-160.avif",
          "webp": "/products/office-footwear-11/204a6fc9/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-11/204a6fc9/card-sm-320.avif",
          "webp": "/products/office-footwear-11/204a6fc9/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-11/204a6fc9/card-480.avif",
          "webp": "/products/office-footwear-11/204a6fc9/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-11/204a6fc9/card-lg-640.avif",
          "webp": "/products/office-footwear-11/204a6fc9/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-11/204a6fc9/pdp-960.avif",
          "webp": "/products/office-footwear-11/204a6fc9/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-11/204a6fc9/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-11/204a6fc9/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-11/204a6fc9/zoom-1600.avif",
          "webp": "/products/office-footwear-11/204a6fc9/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "295.00",
      "currency": "USD",
      "display_amount": "$295.00",
      "amount_in_cents": 29500,
      "compare_at_amount": "339.25",
      "compare_at_amount_in_cents": 33925,
      "display_compare_at_amount": "$339.25"
    },
    "original_price": {
      "amount": "295.00",
      "currency": "USD",
      "display_amount": "$295.00",
      "amount_in_cents": 29500
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_11_8",
    "default_variant": {
      "id": "var_office_footwear_11_8",
      "product_id": "prod_mirza_office_footwear_11",
      "is_master": true,
      "sku": "MIRZA-OFF-011-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "295.00",
        "currency": "USD",
        "display_amount": "$295.00",
        "amount_in_cents": 29500,
        "compare_at_amount_in_cents": 33925,
        "display_compare_at_amount": "$339.25"
      },
      "original_price": {
        "amount": "295.00",
        "currency": "USD",
        "display_amount": "$295.00",
        "amount_in_cents": 29500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_11_7",
        "product_id": "prod_mirza_office_footwear_11",
        "is_master": false,
        "sku": "MIRZA-OFF-011-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "295.00",
          "currency": "USD",
          "display_amount": "$295.00",
          "amount_in_cents": 29500,
          "compare_at_amount_in_cents": 33925,
          "display_compare_at_amount": "$339.25"
        },
        "original_price": {
          "amount": "295.00",
          "currency": "USD",
          "display_amount": "$295.00",
          "amount_in_cents": 29500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_11_8",
        "product_id": "prod_mirza_office_footwear_11",
        "is_master": true,
        "sku": "MIRZA-OFF-011-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "295.00",
          "currency": "USD",
          "display_amount": "$295.00",
          "amount_in_cents": 29500,
          "compare_at_amount_in_cents": 33925,
          "display_compare_at_amount": "$339.25"
        },
        "original_price": {
          "amount": "295.00",
          "currency": "USD",
          "display_amount": "$295.00",
          "amount_in_cents": 29500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_11_9",
        "product_id": "prod_mirza_office_footwear_11",
        "is_master": false,
        "sku": "MIRZA-OFF-011-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "295.00",
          "currency": "USD",
          "display_amount": "$295.00",
          "amount_in_cents": 29500,
          "compare_at_amount_in_cents": 33925,
          "display_compare_at_amount": "$339.25"
        },
        "original_price": {
          "amount": "295.00",
          "currency": "USD",
          "display_amount": "$295.00",
          "amount_in_cents": 29500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_11_10",
        "product_id": "prod_mirza_office_footwear_11",
        "is_master": false,
        "sku": "MIRZA-OFF-011-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "295.00",
          "currency": "USD",
          "display_amount": "$295.00",
          "amount_in_cents": 29500,
          "compare_at_amount_in_cents": 33925,
          "display_compare_at_amount": "$339.25"
        },
        "original_price": {
          "amount": "295.00",
          "currency": "USD",
          "display_amount": "$295.00",
          "amount_in_cents": 29500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_12",
    "name": "The Knightsbridge Plain Derby",
    "slug": "office-footwear-12",
    "sku": "MIRZA-OFF-012",
    "description": "Understated blucher shoe with clean lines, premium French leather, and cushioned leather insole.",
    "description_html": "<p>Understated blucher shoe with clean lines, premium French leather, and cushioned leather insole.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Knightsbridge Plain Derby | Mirza Footwear",
    "meta_description": "Understated blucher shoe with clean lines, premium French leather, and cushioned leather insole.",
    "meta_keywords": "The Knightsbridge Plain Derby, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-12/f335d0af/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_12_1",
      "url": "/products/office-footwear-12/f335d0af/card-lg-640.webp",
      "alt": "The Knightsbridge Plain Derby",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-12/f335d0af/zoom-1600.webp",
      "large_url": "/products/office-footwear-12/f335d0af/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-12/f335d0af/zoom-1600.webp",
      "small_url": "/products/office-footwear-12/f335d0af/card-sm-320.webp",
      "mini_url": "/products/office-footwear-12/f335d0af/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_12_7",
        "var_office_footwear_12_8",
        "var_office_footwear_12_9",
        "var_office_footwear_12_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_12_1",
        "url": "/products/office-footwear-12/f335d0af/card-lg-640.webp",
        "alt": "The Knightsbridge Plain Derby",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-12/f335d0af/zoom-1600.webp",
        "large_url": "/products/office-footwear-12/f335d0af/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-12/f335d0af/zoom-1600.webp",
        "small_url": "/products/office-footwear-12/f335d0af/card-sm-320.webp",
        "mini_url": "/products/office-footwear-12/f335d0af/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_12_7",
          "var_office_footwear_12_8",
          "var_office_footwear_12_9",
          "var_office_footwear_12_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-12/f335d0af/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmoAAABXRUJQVlA4IF4AAAAwAgCdASoQABAABUB8JZQAAv+q5Dw0ZXDYAAD5fNK//mneqXs1os/zZVrXUVKf4olbXnVgnDni89mSdwabeC+MDfefXrmc7cR0kXKCjEmPWZLWWTG9+V9BRZAdkAAA",
      "dominantColor": "#9898a8",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-12/f335d0af/thumb-160.avif",
          "webp": "/products/office-footwear-12/f335d0af/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-12/f335d0af/card-sm-320.avif",
          "webp": "/products/office-footwear-12/f335d0af/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-12/f335d0af/card-480.avif",
          "webp": "/products/office-footwear-12/f335d0af/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-12/f335d0af/card-lg-640.avif",
          "webp": "/products/office-footwear-12/f335d0af/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-12/f335d0af/pdp-960.avif",
          "webp": "/products/office-footwear-12/f335d0af/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-12/f335d0af/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-12/f335d0af/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-12/f335d0af/zoom-1600.avif",
          "webp": "/products/office-footwear-12/f335d0af/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "260.00",
      "currency": "USD",
      "display_amount": "$260.00",
      "amount_in_cents": 26000,
      "compare_at_amount": "299.00",
      "compare_at_amount_in_cents": 29900,
      "display_compare_at_amount": "$299.00"
    },
    "original_price": {
      "amount": "260.00",
      "currency": "USD",
      "display_amount": "$260.00",
      "amount_in_cents": 26000
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_12_8",
    "default_variant": {
      "id": "var_office_footwear_12_8",
      "product_id": "prod_mirza_office_footwear_12",
      "is_master": true,
      "sku": "MIRZA-OFF-012-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "260.00",
        "currency": "USD",
        "display_amount": "$260.00",
        "amount_in_cents": 26000,
        "compare_at_amount_in_cents": 29900,
        "display_compare_at_amount": "$299.00"
      },
      "original_price": {
        "amount": "260.00",
        "currency": "USD",
        "display_amount": "$260.00",
        "amount_in_cents": 26000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_12_7",
        "product_id": "prod_mirza_office_footwear_12",
        "is_master": false,
        "sku": "MIRZA-OFF-012-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "260.00",
          "currency": "USD",
          "display_amount": "$260.00",
          "amount_in_cents": 26000,
          "compare_at_amount_in_cents": 29900,
          "display_compare_at_amount": "$299.00"
        },
        "original_price": {
          "amount": "260.00",
          "currency": "USD",
          "display_amount": "$260.00",
          "amount_in_cents": 26000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_12_8",
        "product_id": "prod_mirza_office_footwear_12",
        "is_master": true,
        "sku": "MIRZA-OFF-012-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "260.00",
          "currency": "USD",
          "display_amount": "$260.00",
          "amount_in_cents": 26000,
          "compare_at_amount_in_cents": 29900,
          "display_compare_at_amount": "$299.00"
        },
        "original_price": {
          "amount": "260.00",
          "currency": "USD",
          "display_amount": "$260.00",
          "amount_in_cents": 26000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_12_9",
        "product_id": "prod_mirza_office_footwear_12",
        "is_master": false,
        "sku": "MIRZA-OFF-012-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "260.00",
          "currency": "USD",
          "display_amount": "$260.00",
          "amount_in_cents": 26000,
          "compare_at_amount_in_cents": 29900,
          "display_compare_at_amount": "$299.00"
        },
        "original_price": {
          "amount": "260.00",
          "currency": "USD",
          "display_amount": "$260.00",
          "amount_in_cents": 26000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_12_10",
        "product_id": "prod_mirza_office_footwear_12",
        "is_master": false,
        "sku": "MIRZA-OFF-012-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "260.00",
          "currency": "USD",
          "display_amount": "$260.00",
          "amount_in_cents": 26000,
          "compare_at_amount_in_cents": 29900,
          "display_compare_at_amount": "$299.00"
        },
        "original_price": {
          "amount": "260.00",
          "currency": "USD",
          "display_amount": "$260.00",
          "amount_in_cents": 26000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_13",
    "name": "The Burlington Bit Loafer",
    "slug": "office-footwear-13",
    "sku": "MIRZA-OFF-013",
    "description": "Italian-inspired loafer adorned with polished silver horsebit hardware on supple grain leather.",
    "description_html": "<p>Italian-inspired loafer adorned with polished silver horsebit hardware on supple grain leather.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Burlington Bit Loafer | Mirza Footwear",
    "meta_description": "Italian-inspired loafer adorned with polished silver horsebit hardware on supple grain leather.",
    "meta_keywords": "The Burlington Bit Loafer, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-13/a9bc51db/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_13_1",
      "url": "/products/office-footwear-13/a9bc51db/card-lg-640.webp",
      "alt": "The Burlington Bit Loafer",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-13/a9bc51db/zoom-1600.webp",
      "large_url": "/products/office-footwear-13/a9bc51db/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-13/a9bc51db/zoom-1600.webp",
      "small_url": "/products/office-footwear-13/a9bc51db/card-sm-320.webp",
      "mini_url": "/products/office-footwear-13/a9bc51db/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_13_7",
        "var_office_footwear_13_8",
        "var_office_footwear_13_9",
        "var_office_footwear_13_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_13_1",
        "url": "/products/office-footwear-13/a9bc51db/card-lg-640.webp",
        "alt": "The Burlington Bit Loafer",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-13/a9bc51db/zoom-1600.webp",
        "large_url": "/products/office-footwear-13/a9bc51db/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-13/a9bc51db/zoom-1600.webp",
        "small_url": "/products/office-footwear-13/a9bc51db/card-sm-320.webp",
        "mini_url": "/products/office-footwear-13/a9bc51db/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_13_7",
          "var_office_footwear_13_8",
          "var_office_footwear_13_9",
          "var_office_footwear_13_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-13/a9bc51db/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmwAAABXRUJQVlA4IGAAAABwAgCdASoQABAABUB8JagCdFQAG9mRCH6PzHeAAP4LkjVDh5D6sC6gUPQb7ucPf/aNXoBwG1BvqsxWlQkG3weMXpm5p1V4y1ma7nPV7jLeroGr3T+wo/OnWsWb/517oAA=",
      "dominantColor": "#989898",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-13/a9bc51db/thumb-160.avif",
          "webp": "/products/office-footwear-13/a9bc51db/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-13/a9bc51db/card-sm-320.avif",
          "webp": "/products/office-footwear-13/a9bc51db/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-13/a9bc51db/card-480.avif",
          "webp": "/products/office-footwear-13/a9bc51db/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-13/a9bc51db/card-lg-640.avif",
          "webp": "/products/office-footwear-13/a9bc51db/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-13/a9bc51db/pdp-960.avif",
          "webp": "/products/office-footwear-13/a9bc51db/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-13/a9bc51db/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-13/a9bc51db/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-13/a9bc51db/zoom-1600.avif",
          "webp": "/products/office-footwear-13/a9bc51db/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "270.00",
      "currency": "USD",
      "display_amount": "$270.00",
      "amount_in_cents": 27000,
      "compare_at_amount": "310.50",
      "compare_at_amount_in_cents": 31050,
      "display_compare_at_amount": "$310.50"
    },
    "original_price": {
      "amount": "270.00",
      "currency": "USD",
      "display_amount": "$270.00",
      "amount_in_cents": 27000
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_13_8",
    "default_variant": {
      "id": "var_office_footwear_13_8",
      "product_id": "prod_mirza_office_footwear_13",
      "is_master": true,
      "sku": "MIRZA-OFF-013-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "270.00",
        "currency": "USD",
        "display_amount": "$270.00",
        "amount_in_cents": 27000,
        "compare_at_amount_in_cents": 31050,
        "display_compare_at_amount": "$310.50"
      },
      "original_price": {
        "amount": "270.00",
        "currency": "USD",
        "display_amount": "$270.00",
        "amount_in_cents": 27000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_13_7",
        "product_id": "prod_mirza_office_footwear_13",
        "is_master": false,
        "sku": "MIRZA-OFF-013-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "270.00",
          "currency": "USD",
          "display_amount": "$270.00",
          "amount_in_cents": 27000,
          "compare_at_amount_in_cents": 31050,
          "display_compare_at_amount": "$310.50"
        },
        "original_price": {
          "amount": "270.00",
          "currency": "USD",
          "display_amount": "$270.00",
          "amount_in_cents": 27000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_13_8",
        "product_id": "prod_mirza_office_footwear_13",
        "is_master": true,
        "sku": "MIRZA-OFF-013-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "270.00",
          "currency": "USD",
          "display_amount": "$270.00",
          "amount_in_cents": 27000,
          "compare_at_amount_in_cents": 31050,
          "display_compare_at_amount": "$310.50"
        },
        "original_price": {
          "amount": "270.00",
          "currency": "USD",
          "display_amount": "$270.00",
          "amount_in_cents": 27000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_13_9",
        "product_id": "prod_mirza_office_footwear_13",
        "is_master": false,
        "sku": "MIRZA-OFF-013-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "270.00",
          "currency": "USD",
          "display_amount": "$270.00",
          "amount_in_cents": 27000,
          "compare_at_amount_in_cents": 31050,
          "display_compare_at_amount": "$310.50"
        },
        "original_price": {
          "amount": "270.00",
          "currency": "USD",
          "display_amount": "$270.00",
          "amount_in_cents": 27000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_13_10",
        "product_id": "prod_mirza_office_footwear_13",
        "is_master": false,
        "sku": "MIRZA-OFF-013-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "270.00",
          "currency": "USD",
          "display_amount": "$270.00",
          "amount_in_cents": 27000,
          "compare_at_amount_in_cents": 31050,
          "display_compare_at_amount": "$310.50"
        },
        "original_price": {
          "amount": "270.00",
          "currency": "USD",
          "display_amount": "$270.00",
          "amount_in_cents": 27000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_14",
    "name": "The Carlton Brogue Derby",
    "slug": "office-footwear-14",
    "sku": "MIRZA-OFF-014",
    "description": "Country calf brogue derby with heavy perforation detail and durable commando rubber sole.",
    "description_html": "<p>Country calf brogue derby with heavy perforation detail and durable commando rubber sole.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Carlton Brogue Derby | Mirza Footwear",
    "meta_description": "Country calf brogue derby with heavy perforation detail and durable commando rubber sole.",
    "meta_keywords": "The Carlton Brogue Derby, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-14/95e2cf61/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_14_1",
      "url": "/products/office-footwear-14/95e2cf61/card-lg-640.webp",
      "alt": "The Carlton Brogue Derby",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-14/95e2cf61/zoom-1600.webp",
      "large_url": "/products/office-footwear-14/95e2cf61/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-14/95e2cf61/zoom-1600.webp",
      "small_url": "/products/office-footwear-14/95e2cf61/card-sm-320.webp",
      "mini_url": "/products/office-footwear-14/95e2cf61/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_14_7",
        "var_office_footwear_14_8",
        "var_office_footwear_14_9",
        "var_office_footwear_14_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_14_1",
        "url": "/products/office-footwear-14/95e2cf61/card-lg-640.webp",
        "alt": "The Carlton Brogue Derby",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-14/95e2cf61/zoom-1600.webp",
        "large_url": "/products/office-footwear-14/95e2cf61/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-14/95e2cf61/zoom-1600.webp",
        "small_url": "/products/office-footwear-14/95e2cf61/card-sm-320.webp",
        "mini_url": "/products/office-footwear-14/95e2cf61/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_14_7",
          "var_office_footwear_14_8",
          "var_office_footwear_14_9",
          "var_office_footwear_14_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-14/95e2cf61/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAADwAQCdASoQABAABUB8JZwAApL/wRUNQAAA+X32cv7BwqRyEbMhNgKentbZasFyJii+382F1kD64QduXXc6X5P5PVmVtiVYaJruzIbW4zxHN5uVB00AAA==",
      "dominantColor": "#b8b8c8",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-14/95e2cf61/thumb-160.avif",
          "webp": "/products/office-footwear-14/95e2cf61/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-14/95e2cf61/card-sm-320.avif",
          "webp": "/products/office-footwear-14/95e2cf61/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-14/95e2cf61/card-480.avif",
          "webp": "/products/office-footwear-14/95e2cf61/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-14/95e2cf61/card-lg-640.avif",
          "webp": "/products/office-footwear-14/95e2cf61/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-14/95e2cf61/pdp-960.avif",
          "webp": "/products/office-footwear-14/95e2cf61/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-14/95e2cf61/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-14/95e2cf61/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-14/95e2cf61/zoom-1600.avif",
          "webp": "/products/office-footwear-14/95e2cf61/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "285.00",
      "currency": "USD",
      "display_amount": "$285.00",
      "amount_in_cents": 28500,
      "compare_at_amount": "327.75",
      "compare_at_amount_in_cents": 32775,
      "display_compare_at_amount": "$327.75"
    },
    "original_price": {
      "amount": "285.00",
      "currency": "USD",
      "display_amount": "$285.00",
      "amount_in_cents": 28500
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_14_8",
    "default_variant": {
      "id": "var_office_footwear_14_8",
      "product_id": "prod_mirza_office_footwear_14",
      "is_master": true,
      "sku": "MIRZA-OFF-014-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "285.00",
        "currency": "USD",
        "display_amount": "$285.00",
        "amount_in_cents": 28500,
        "compare_at_amount_in_cents": 32775,
        "display_compare_at_amount": "$327.75"
      },
      "original_price": {
        "amount": "285.00",
        "currency": "USD",
        "display_amount": "$285.00",
        "amount_in_cents": 28500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_14_7",
        "product_id": "prod_mirza_office_footwear_14",
        "is_master": false,
        "sku": "MIRZA-OFF-014-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "285.00",
          "currency": "USD",
          "display_amount": "$285.00",
          "amount_in_cents": 28500,
          "compare_at_amount_in_cents": 32775,
          "display_compare_at_amount": "$327.75"
        },
        "original_price": {
          "amount": "285.00",
          "currency": "USD",
          "display_amount": "$285.00",
          "amount_in_cents": 28500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_14_8",
        "product_id": "prod_mirza_office_footwear_14",
        "is_master": true,
        "sku": "MIRZA-OFF-014-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "285.00",
          "currency": "USD",
          "display_amount": "$285.00",
          "amount_in_cents": 28500,
          "compare_at_amount_in_cents": 32775,
          "display_compare_at_amount": "$327.75"
        },
        "original_price": {
          "amount": "285.00",
          "currency": "USD",
          "display_amount": "$285.00",
          "amount_in_cents": 28500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_14_9",
        "product_id": "prod_mirza_office_footwear_14",
        "is_master": false,
        "sku": "MIRZA-OFF-014-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "285.00",
          "currency": "USD",
          "display_amount": "$285.00",
          "amount_in_cents": 28500,
          "compare_at_amount_in_cents": 32775,
          "display_compare_at_amount": "$327.75"
        },
        "original_price": {
          "amount": "285.00",
          "currency": "USD",
          "display_amount": "$285.00",
          "amount_in_cents": 28500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_14_10",
        "product_id": "prod_mirza_office_footwear_14",
        "is_master": false,
        "sku": "MIRZA-OFF-014-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "285.00",
          "currency": "USD",
          "display_amount": "$285.00",
          "amount_in_cents": 28500,
          "compare_at_amount_in_cents": 32775,
          "display_compare_at_amount": "$327.75"
        },
        "original_price": {
          "amount": "285.00",
          "currency": "USD",
          "display_amount": "$285.00",
          "amount_in_cents": 28500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_15",
    "name": "The Grosvenor Dress Boot",
    "slug": "office-footwear-15",
    "sku": "MIRZA-OFF-015",
    "description": "Executive high-ankle lace-up dress boot with speed hooks and channel-stitched leather sole.",
    "description_html": "<p>Executive high-ankle lace-up dress boot with speed hooks and channel-stitched leather sole.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Grosvenor Dress Boot | Mirza Footwear",
    "meta_description": "Executive high-ankle lace-up dress boot with speed hooks and channel-stitched leather sole.",
    "meta_keywords": "The Grosvenor Dress Boot, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-15/e12c5840/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_15_1",
      "url": "/products/office-footwear-15/e12c5840/card-lg-640.webp",
      "alt": "The Grosvenor Dress Boot",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-15/e12c5840/zoom-1600.webp",
      "large_url": "/products/office-footwear-15/e12c5840/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-15/e12c5840/zoom-1600.webp",
      "small_url": "/products/office-footwear-15/e12c5840/card-sm-320.webp",
      "mini_url": "/products/office-footwear-15/e12c5840/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_15_7",
        "var_office_footwear_15_8",
        "var_office_footwear_15_9",
        "var_office_footwear_15_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_15_1",
        "url": "/products/office-footwear-15/e12c5840/card-lg-640.webp",
        "alt": "The Grosvenor Dress Boot",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-15/e12c5840/zoom-1600.webp",
        "large_url": "/products/office-footwear-15/e12c5840/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-15/e12c5840/zoom-1600.webp",
        "small_url": "/products/office-footwear-15/e12c5840/card-sm-320.webp",
        "mini_url": "/products/office-footwear-15/e12c5840/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_15_7",
          "var_office_footwear_15_8",
          "var_office_footwear_15_9",
          "var_office_footwear_15_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-15/e12c5840/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmoAAABXRUJQVlA4IF4AAADwAQCdASoQABAABUB8JZwAAudpQ+ZDYAAA/mzr3xv4YZg2Q5Mhp92M4HBrlm0MnxBokiS8BSE2P6ApkHlN7WyIdmsLfAa16gFZReQ5tSoIyzwiiwYTcUW9AUkTGEAA",
      "dominantColor": "#382828",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-15/e12c5840/thumb-160.avif",
          "webp": "/products/office-footwear-15/e12c5840/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-15/e12c5840/card-sm-320.avif",
          "webp": "/products/office-footwear-15/e12c5840/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-15/e12c5840/card-480.avif",
          "webp": "/products/office-footwear-15/e12c5840/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-15/e12c5840/card-lg-640.avif",
          "webp": "/products/office-footwear-15/e12c5840/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-15/e12c5840/pdp-960.avif",
          "webp": "/products/office-footwear-15/e12c5840/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-15/e12c5840/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-15/e12c5840/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-15/e12c5840/zoom-1600.avif",
          "webp": "/products/office-footwear-15/e12c5840/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "340.00",
      "currency": "USD",
      "display_amount": "$340.00",
      "amount_in_cents": 34000,
      "compare_at_amount": "391.00",
      "compare_at_amount_in_cents": 39100,
      "display_compare_at_amount": "$391.00"
    },
    "original_price": {
      "amount": "340.00",
      "currency": "USD",
      "display_amount": "$340.00",
      "amount_in_cents": 34000
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_15_8",
    "default_variant": {
      "id": "var_office_footwear_15_8",
      "product_id": "prod_mirza_office_footwear_15",
      "is_master": true,
      "sku": "MIRZA-OFF-015-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "340.00",
        "currency": "USD",
        "display_amount": "$340.00",
        "amount_in_cents": 34000,
        "compare_at_amount_in_cents": 39100,
        "display_compare_at_amount": "$391.00"
      },
      "original_price": {
        "amount": "340.00",
        "currency": "USD",
        "display_amount": "$340.00",
        "amount_in_cents": 34000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_15_7",
        "product_id": "prod_mirza_office_footwear_15",
        "is_master": false,
        "sku": "MIRZA-OFF-015-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "340.00",
          "currency": "USD",
          "display_amount": "$340.00",
          "amount_in_cents": 34000,
          "compare_at_amount_in_cents": 39100,
          "display_compare_at_amount": "$391.00"
        },
        "original_price": {
          "amount": "340.00",
          "currency": "USD",
          "display_amount": "$340.00",
          "amount_in_cents": 34000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_15_8",
        "product_id": "prod_mirza_office_footwear_15",
        "is_master": true,
        "sku": "MIRZA-OFF-015-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "340.00",
          "currency": "USD",
          "display_amount": "$340.00",
          "amount_in_cents": 34000,
          "compare_at_amount_in_cents": 39100,
          "display_compare_at_amount": "$391.00"
        },
        "original_price": {
          "amount": "340.00",
          "currency": "USD",
          "display_amount": "$340.00",
          "amount_in_cents": 34000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_15_9",
        "product_id": "prod_mirza_office_footwear_15",
        "is_master": false,
        "sku": "MIRZA-OFF-015-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "340.00",
          "currency": "USD",
          "display_amount": "$340.00",
          "amount_in_cents": 34000,
          "compare_at_amount_in_cents": 39100,
          "display_compare_at_amount": "$391.00"
        },
        "original_price": {
          "amount": "340.00",
          "currency": "USD",
          "display_amount": "$340.00",
          "amount_in_cents": 34000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_15_10",
        "product_id": "prod_mirza_office_footwear_15",
        "is_master": false,
        "sku": "MIRZA-OFF-015-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "340.00",
          "currency": "USD",
          "display_amount": "$340.00",
          "amount_in_cents": 34000,
          "compare_at_amount_in_cents": 39100,
          "display_compare_at_amount": "$391.00"
        },
        "original_price": {
          "amount": "340.00",
          "currency": "USD",
          "display_amount": "$340.00",
          "amount_in_cents": 34000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_16",
    "name": "The Oxford Adelaide Brogue",
    "slug": "office-footwear-16",
    "sku": "MIRZA-OFF-016",
    "description": "Unique Adelaide throat styling with sweeping brogue contours in hand-painted museum calf.",
    "description_html": "<p>Unique Adelaide throat styling with sweeping brogue contours in hand-painted museum calf.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Oxford Adelaide Brogue | Mirza Footwear",
    "meta_description": "Unique Adelaide throat styling with sweeping brogue contours in hand-painted museum calf.",
    "meta_keywords": "The Oxford Adelaide Brogue, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-16/61c96bdb/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_16_1",
      "url": "/products/office-footwear-16/61c96bdb/card-lg-640.webp",
      "alt": "The Oxford Adelaide Brogue",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-16/61c96bdb/zoom-1600.webp",
      "large_url": "/products/office-footwear-16/61c96bdb/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-16/61c96bdb/zoom-1600.webp",
      "small_url": "/products/office-footwear-16/61c96bdb/card-sm-320.webp",
      "mini_url": "/products/office-footwear-16/61c96bdb/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_16_7",
        "var_office_footwear_16_8",
        "var_office_footwear_16_9",
        "var_office_footwear_16_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_16_1",
        "url": "/products/office-footwear-16/61c96bdb/card-lg-640.webp",
        "alt": "The Oxford Adelaide Brogue",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-16/61c96bdb/zoom-1600.webp",
        "large_url": "/products/office-footwear-16/61c96bdb/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-16/61c96bdb/zoom-1600.webp",
        "small_url": "/products/office-footwear-16/61c96bdb/card-sm-320.webp",
        "mini_url": "/products/office-footwear-16/61c96bdb/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_16_7",
          "var_office_footwear_16_8",
          "var_office_footwear_16_9",
          "var_office_footwear_16_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-16/61c96bdb/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRnIAAABXRUJQVlA4IGYAAACwAQCdASoQABAABUB8JZwAAhU59r0IAP5s8pQd/hko5exRnBGzeO07IbEL+A55dTL22tjlCRhJVKiFqiejlZc5jE7mJZRoAUASmATHSoJtzPpIuz5jNx/WCHQfPnnD8htTcYKAAAA=",
      "dominantColor": "#080808",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-16/61c96bdb/thumb-160.avif",
          "webp": "/products/office-footwear-16/61c96bdb/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-16/61c96bdb/card-sm-320.avif",
          "webp": "/products/office-footwear-16/61c96bdb/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-16/61c96bdb/card-480.avif",
          "webp": "/products/office-footwear-16/61c96bdb/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-16/61c96bdb/card-lg-640.avif",
          "webp": "/products/office-footwear-16/61c96bdb/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-16/61c96bdb/pdp-960.avif",
          "webp": "/products/office-footwear-16/61c96bdb/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-16/61c96bdb/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-16/61c96bdb/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-16/61c96bdb/zoom-1600.avif",
          "webp": "/products/office-footwear-16/61c96bdb/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "310.00",
      "currency": "USD",
      "display_amount": "$310.00",
      "amount_in_cents": 31000,
      "compare_at_amount": "356.50",
      "compare_at_amount_in_cents": 35650,
      "display_compare_at_amount": "$356.50"
    },
    "original_price": {
      "amount": "310.00",
      "currency": "USD",
      "display_amount": "$310.00",
      "amount_in_cents": 31000
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_16_8",
    "default_variant": {
      "id": "var_office_footwear_16_8",
      "product_id": "prod_mirza_office_footwear_16",
      "is_master": true,
      "sku": "MIRZA-OFF-016-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "310.00",
        "currency": "USD",
        "display_amount": "$310.00",
        "amount_in_cents": 31000,
        "compare_at_amount_in_cents": 35650,
        "display_compare_at_amount": "$356.50"
      },
      "original_price": {
        "amount": "310.00",
        "currency": "USD",
        "display_amount": "$310.00",
        "amount_in_cents": 31000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_16_7",
        "product_id": "prod_mirza_office_footwear_16",
        "is_master": false,
        "sku": "MIRZA-OFF-016-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "310.00",
          "currency": "USD",
          "display_amount": "$310.00",
          "amount_in_cents": 31000,
          "compare_at_amount_in_cents": 35650,
          "display_compare_at_amount": "$356.50"
        },
        "original_price": {
          "amount": "310.00",
          "currency": "USD",
          "display_amount": "$310.00",
          "amount_in_cents": 31000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_16_8",
        "product_id": "prod_mirza_office_footwear_16",
        "is_master": true,
        "sku": "MIRZA-OFF-016-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "310.00",
          "currency": "USD",
          "display_amount": "$310.00",
          "amount_in_cents": 31000,
          "compare_at_amount_in_cents": 35650,
          "display_compare_at_amount": "$356.50"
        },
        "original_price": {
          "amount": "310.00",
          "currency": "USD",
          "display_amount": "$310.00",
          "amount_in_cents": 31000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_16_9",
        "product_id": "prod_mirza_office_footwear_16",
        "is_master": false,
        "sku": "MIRZA-OFF-016-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "310.00",
          "currency": "USD",
          "display_amount": "$310.00",
          "amount_in_cents": 31000,
          "compare_at_amount_in_cents": 35650,
          "display_compare_at_amount": "$356.50"
        },
        "original_price": {
          "amount": "310.00",
          "currency": "USD",
          "display_amount": "$310.00",
          "amount_in_cents": 31000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_16_10",
        "product_id": "prod_mirza_office_footwear_16",
        "is_master": false,
        "sku": "MIRZA-OFF-016-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "310.00",
          "currency": "USD",
          "display_amount": "$310.00",
          "amount_in_cents": 31000,
          "compare_at_amount_in_cents": 35650,
          "display_compare_at_amount": "$356.50"
        },
        "original_price": {
          "amount": "310.00",
          "currency": "USD",
          "display_amount": "$310.00",
          "amount_in_cents": 31000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_17",
    "name": "The Chelsea Goodyear Boot",
    "slug": "office-footwear-17",
    "sku": "MIRZA-OFF-017",
    "description": "Heavyweight Chelsea boot in full-grain waxy pull-up leather with Goodyear welted construction.",
    "description_html": "<p>Heavyweight Chelsea boot in full-grain waxy pull-up leather with Goodyear welted construction.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Chelsea Goodyear Boot | Mirza Footwear",
    "meta_description": "Heavyweight Chelsea boot in full-grain waxy pull-up leather with Goodyear welted construction.",
    "meta_keywords": "The Chelsea Goodyear Boot, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-17/5b28d33a/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_17_1",
      "url": "/products/office-footwear-17/5b28d33a/card-lg-640.webp",
      "alt": "The Chelsea Goodyear Boot",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-17/5b28d33a/zoom-1600.webp",
      "large_url": "/products/office-footwear-17/5b28d33a/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-17/5b28d33a/zoom-1600.webp",
      "small_url": "/products/office-footwear-17/5b28d33a/card-sm-320.webp",
      "mini_url": "/products/office-footwear-17/5b28d33a/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_17_7",
        "var_office_footwear_17_8",
        "var_office_footwear_17_9",
        "var_office_footwear_17_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_17_1",
        "url": "/products/office-footwear-17/5b28d33a/card-lg-640.webp",
        "alt": "The Chelsea Goodyear Boot",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-17/5b28d33a/zoom-1600.webp",
        "large_url": "/products/office-footwear-17/5b28d33a/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-17/5b28d33a/zoom-1600.webp",
        "small_url": "/products/office-footwear-17/5b28d33a/card-sm-320.webp",
        "mini_url": "/products/office-footwear-17/5b28d33a/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_17_7",
          "var_office_footwear_17_8",
          "var_office_footwear_17_9",
          "var_office_footwear_17_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-17/5b28d33a/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAADwAQCdASoQABAABUB8JZwAAq8rY/RNnYAA/QK0Cv+tgIMyk0XgxasoU/OWldTnxqKd60XIb9tVO68DeCvjfnw3t4dZ0GtVkCCxn/Q02XwvTnYP0DAmHSEAAAA=",
      "dominantColor": "#787878",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-17/5b28d33a/thumb-160.avif",
          "webp": "/products/office-footwear-17/5b28d33a/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-17/5b28d33a/card-sm-320.avif",
          "webp": "/products/office-footwear-17/5b28d33a/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-17/5b28d33a/card-480.avif",
          "webp": "/products/office-footwear-17/5b28d33a/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-17/5b28d33a/card-lg-640.avif",
          "webp": "/products/office-footwear-17/5b28d33a/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-17/5b28d33a/pdp-960.avif",
          "webp": "/products/office-footwear-17/5b28d33a/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-17/5b28d33a/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-17/5b28d33a/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-17/5b28d33a/zoom-1600.avif",
          "webp": "/products/office-footwear-17/5b28d33a/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "325.00",
      "currency": "USD",
      "display_amount": "$325.00",
      "amount_in_cents": 32500,
      "compare_at_amount": "373.75",
      "compare_at_amount_in_cents": 37375,
      "display_compare_at_amount": "$373.75"
    },
    "original_price": {
      "amount": "325.00",
      "currency": "USD",
      "display_amount": "$325.00",
      "amount_in_cents": 32500
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_17_8",
    "default_variant": {
      "id": "var_office_footwear_17_8",
      "product_id": "prod_mirza_office_footwear_17",
      "is_master": true,
      "sku": "MIRZA-OFF-017-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "325.00",
        "currency": "USD",
        "display_amount": "$325.00",
        "amount_in_cents": 32500,
        "compare_at_amount_in_cents": 37375,
        "display_compare_at_amount": "$373.75"
      },
      "original_price": {
        "amount": "325.00",
        "currency": "USD",
        "display_amount": "$325.00",
        "amount_in_cents": 32500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_17_7",
        "product_id": "prod_mirza_office_footwear_17",
        "is_master": false,
        "sku": "MIRZA-OFF-017-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "325.00",
          "currency": "USD",
          "display_amount": "$325.00",
          "amount_in_cents": 32500,
          "compare_at_amount_in_cents": 37375,
          "display_compare_at_amount": "$373.75"
        },
        "original_price": {
          "amount": "325.00",
          "currency": "USD",
          "display_amount": "$325.00",
          "amount_in_cents": 32500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_17_8",
        "product_id": "prod_mirza_office_footwear_17",
        "is_master": true,
        "sku": "MIRZA-OFF-017-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "325.00",
          "currency": "USD",
          "display_amount": "$325.00",
          "amount_in_cents": 32500,
          "compare_at_amount_in_cents": 37375,
          "display_compare_at_amount": "$373.75"
        },
        "original_price": {
          "amount": "325.00",
          "currency": "USD",
          "display_amount": "$325.00",
          "amount_in_cents": 32500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_17_9",
        "product_id": "prod_mirza_office_footwear_17",
        "is_master": false,
        "sku": "MIRZA-OFF-017-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "325.00",
          "currency": "USD",
          "display_amount": "$325.00",
          "amount_in_cents": 32500,
          "compare_at_amount_in_cents": 37375,
          "display_compare_at_amount": "$373.75"
        },
        "original_price": {
          "amount": "325.00",
          "currency": "USD",
          "display_amount": "$325.00",
          "amount_in_cents": 32500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_17_10",
        "product_id": "prod_mirza_office_footwear_17",
        "is_master": false,
        "sku": "MIRZA-OFF-017-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "325.00",
          "currency": "USD",
          "display_amount": "$325.00",
          "amount_in_cents": 32500,
          "compare_at_amount_in_cents": 37375,
          "display_compare_at_amount": "$373.75"
        },
        "original_price": {
          "amount": "325.00",
          "currency": "USD",
          "display_amount": "$325.00",
          "amount_in_cents": 32500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_18",
    "name": "The Whitehall Executive Loafer",
    "slug": "office-footwear-18",
    "sku": "MIRZA-OFF-018",
    "description": "Tailored dress loafer designed for all-day comfort with concealed elastic arch support.",
    "description_html": "<p>Tailored dress loafer designed for all-day comfort with concealed elastic arch support.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Whitehall Executive Loafer | Mirza Footwear",
    "meta_description": "Tailored dress loafer designed for all-day comfort with concealed elastic arch support.",
    "meta_keywords": "The Whitehall Executive Loafer, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-18/cf8ccdb0/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_18_1",
      "url": "/products/office-footwear-18/cf8ccdb0/card-lg-640.webp",
      "alt": "The Whitehall Executive Loafer",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-18/cf8ccdb0/zoom-1600.webp",
      "large_url": "/products/office-footwear-18/cf8ccdb0/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-18/cf8ccdb0/zoom-1600.webp",
      "small_url": "/products/office-footwear-18/cf8ccdb0/card-sm-320.webp",
      "mini_url": "/products/office-footwear-18/cf8ccdb0/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_18_7",
        "var_office_footwear_18_8",
        "var_office_footwear_18_9",
        "var_office_footwear_18_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_18_1",
        "url": "/products/office-footwear-18/cf8ccdb0/card-lg-640.webp",
        "alt": "The Whitehall Executive Loafer",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-18/cf8ccdb0/zoom-1600.webp",
        "large_url": "/products/office-footwear-18/cf8ccdb0/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-18/cf8ccdb0/zoom-1600.webp",
        "small_url": "/products/office-footwear-18/cf8ccdb0/card-sm-320.webp",
        "mini_url": "/products/office-footwear-18/cf8ccdb0/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_18_7",
          "var_office_footwear_18_8",
          "var_office_footwear_18_9",
          "var_office_footwear_18_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-18/cf8ccdb0/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAAAwAgCdASoQABAABUB8JZQCw7EPSrO/J3sJeAD+ynRxfGumsvmDe8bMQWrJgnRU7yn3937ZS7Wqq7Yvd2WqHX3TDL0k5BWqt1xHqyz/LawAAA==",
      "dominantColor": "#c8c8d8",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-18/cf8ccdb0/thumb-160.avif",
          "webp": "/products/office-footwear-18/cf8ccdb0/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-18/cf8ccdb0/card-sm-320.avif",
          "webp": "/products/office-footwear-18/cf8ccdb0/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-18/cf8ccdb0/card-480.avif",
          "webp": "/products/office-footwear-18/cf8ccdb0/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-18/cf8ccdb0/card-lg-640.avif",
          "webp": "/products/office-footwear-18/cf8ccdb0/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-18/cf8ccdb0/pdp-960.avif",
          "webp": "/products/office-footwear-18/cf8ccdb0/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-18/cf8ccdb0/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-18/cf8ccdb0/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-18/cf8ccdb0/zoom-1600.avif",
          "webp": "/products/office-footwear-18/cf8ccdb0/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "250.00",
      "currency": "USD",
      "display_amount": "$250.00",
      "amount_in_cents": 25000,
      "compare_at_amount": "287.50",
      "compare_at_amount_in_cents": 28750,
      "display_compare_at_amount": "$287.50"
    },
    "original_price": {
      "amount": "250.00",
      "currency": "USD",
      "display_amount": "$250.00",
      "amount_in_cents": 25000
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_18_8",
    "default_variant": {
      "id": "var_office_footwear_18_8",
      "product_id": "prod_mirza_office_footwear_18",
      "is_master": true,
      "sku": "MIRZA-OFF-018-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "250.00",
        "currency": "USD",
        "display_amount": "$250.00",
        "amount_in_cents": 25000,
        "compare_at_amount_in_cents": 28750,
        "display_compare_at_amount": "$287.50"
      },
      "original_price": {
        "amount": "250.00",
        "currency": "USD",
        "display_amount": "$250.00",
        "amount_in_cents": 25000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_18_7",
        "product_id": "prod_mirza_office_footwear_18",
        "is_master": false,
        "sku": "MIRZA-OFF-018-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "250.00",
          "currency": "USD",
          "display_amount": "$250.00",
          "amount_in_cents": 25000,
          "compare_at_amount_in_cents": 28750,
          "display_compare_at_amount": "$287.50"
        },
        "original_price": {
          "amount": "250.00",
          "currency": "USD",
          "display_amount": "$250.00",
          "amount_in_cents": 25000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_18_8",
        "product_id": "prod_mirza_office_footwear_18",
        "is_master": true,
        "sku": "MIRZA-OFF-018-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "250.00",
          "currency": "USD",
          "display_amount": "$250.00",
          "amount_in_cents": 25000,
          "compare_at_amount_in_cents": 28750,
          "display_compare_at_amount": "$287.50"
        },
        "original_price": {
          "amount": "250.00",
          "currency": "USD",
          "display_amount": "$250.00",
          "amount_in_cents": 25000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_18_9",
        "product_id": "prod_mirza_office_footwear_18",
        "is_master": false,
        "sku": "MIRZA-OFF-018-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "250.00",
          "currency": "USD",
          "display_amount": "$250.00",
          "amount_in_cents": 25000,
          "compare_at_amount_in_cents": 28750,
          "display_compare_at_amount": "$287.50"
        },
        "original_price": {
          "amount": "250.00",
          "currency": "USD",
          "display_amount": "$250.00",
          "amount_in_cents": 25000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_18_10",
        "product_id": "prod_mirza_office_footwear_18",
        "is_master": false,
        "sku": "MIRZA-OFF-018-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "250.00",
          "currency": "USD",
          "display_amount": "$250.00",
          "amount_in_cents": 25000,
          "compare_at_amount_in_cents": 28750,
          "display_compare_at_amount": "$287.50"
        },
        "original_price": {
          "amount": "250.00",
          "currency": "USD",
          "display_amount": "$250.00",
          "amount_in_cents": 25000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_office_footwear_19",
    "name": "The Sovereign Split-Toe Derby",
    "slug": "office-footwear-19",
    "sku": "MIRZA-OFF-019",
    "description": "Hand-sewn Norwegian split-toe derby showcasing master leather craftsmanship.",
    "description_html": "<p>Hand-sewn Norwegian split-toe derby showcasing master leather craftsmanship.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Sovereign Split-Toe Derby | Mirza Footwear",
    "meta_description": "Hand-sewn Norwegian split-toe derby showcasing master leather craftsmanship.",
    "meta_keywords": "The Sovereign Split-Toe Derby, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/office-footwear-19/d09ccf8c/card-sm-320.webp",
    "primary_media": {
      "id": "med_office_footwear_19_1",
      "url": "/products/office-footwear-19/d09ccf8c/card-lg-640.webp",
      "alt": "The Sovereign Split-Toe Derby",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/office-footwear-19/d09ccf8c/zoom-1600.webp",
      "large_url": "/products/office-footwear-19/d09ccf8c/card-lg-640.webp",
      "xlarge_url": "/products/office-footwear-19/d09ccf8c/zoom-1600.webp",
      "small_url": "/products/office-footwear-19/d09ccf8c/card-sm-320.webp",
      "mini_url": "/products/office-footwear-19/d09ccf8c/card-sm-320.webp",
      "variant_ids": [
        "var_office_footwear_19_7",
        "var_office_footwear_19_8",
        "var_office_footwear_19_9",
        "var_office_footwear_19_10"
      ]
    },
    "media": [
      {
        "id": "med_office_footwear_19_1",
        "url": "/products/office-footwear-19/d09ccf8c/card-lg-640.webp",
        "alt": "The Sovereign Split-Toe Derby",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/office-footwear-19/d09ccf8c/zoom-1600.webp",
        "large_url": "/products/office-footwear-19/d09ccf8c/card-lg-640.webp",
        "xlarge_url": "/products/office-footwear-19/d09ccf8c/zoom-1600.webp",
        "small_url": "/products/office-footwear-19/d09ccf8c/card-sm-320.webp",
        "mini_url": "/products/office-footwear-19/d09ccf8c/card-sm-320.webp",
        "variant_ids": [
          "var_office_footwear_19_7",
          "var_office_footwear_19_8",
          "var_office_footwear_19_9",
          "var_office_footwear_19_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/office-footwear-19/d09ccf8c/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAADQAQCdASoQABAABUB8JYwAAvv6Yn8zAAD+C4nQn0O93hLJWzEWbeeJ6JcQkL11f5EWbsxV8LAzoHZuTWosLP/WyU8iWAc5W0muwYFcdIAAAA==",
      "dominantColor": "#383848",
      "variants": {
        "160": {
          "avif": "/products/office-footwear-19/d09ccf8c/thumb-160.avif",
          "webp": "/products/office-footwear-19/d09ccf8c/thumb-160.webp"
        },
        "320": {
          "avif": "/products/office-footwear-19/d09ccf8c/card-sm-320.avif",
          "webp": "/products/office-footwear-19/d09ccf8c/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/office-footwear-19/d09ccf8c/card-480.avif",
          "webp": "/products/office-footwear-19/d09ccf8c/card-480.webp"
        },
        "640": {
          "avif": "/products/office-footwear-19/d09ccf8c/card-lg-640.avif",
          "webp": "/products/office-footwear-19/d09ccf8c/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/office-footwear-19/d09ccf8c/pdp-960.avif",
          "webp": "/products/office-footwear-19/d09ccf8c/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/office-footwear-19/d09ccf8c/pdp-lg-1280.avif",
          "webp": "/products/office-footwear-19/d09ccf8c/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/office-footwear-19/d09ccf8c/zoom-1600.avif",
          "webp": "/products/office-footwear-19/d09ccf8c/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "290.00",
      "currency": "USD",
      "display_amount": "$290.00",
      "amount_in_cents": 29000,
      "compare_at_amount": "333.50",
      "compare_at_amount_in_cents": 33350,
      "display_compare_at_amount": "$333.50"
    },
    "original_price": {
      "amount": "290.00",
      "currency": "USD",
      "display_amount": "$290.00",
      "amount_in_cents": 29000
    },
    "categories": [
      {
        "id": "7",
        "name": "Office Wear",
        "permalink": "categories/office-wear",
        "description": "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_office_footwear_19_8",
    "default_variant": {
      "id": "var_office_footwear_19_8",
      "product_id": "prod_mirza_office_footwear_19",
      "is_master": true,
      "sku": "MIRZA-OFF-019-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "290.00",
        "currency": "USD",
        "display_amount": "$290.00",
        "amount_in_cents": 29000,
        "compare_at_amount_in_cents": 33350,
        "display_compare_at_amount": "$333.50"
      },
      "original_price": {
        "amount": "290.00",
        "currency": "USD",
        "display_amount": "$290.00",
        "amount_in_cents": 29000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_office_footwear_19_7",
        "product_id": "prod_mirza_office_footwear_19",
        "is_master": false,
        "sku": "MIRZA-OFF-019-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "290.00",
          "currency": "USD",
          "display_amount": "$290.00",
          "amount_in_cents": 29000,
          "compare_at_amount_in_cents": 33350,
          "display_compare_at_amount": "$333.50"
        },
        "original_price": {
          "amount": "290.00",
          "currency": "USD",
          "display_amount": "$290.00",
          "amount_in_cents": 29000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_19_8",
        "product_id": "prod_mirza_office_footwear_19",
        "is_master": true,
        "sku": "MIRZA-OFF-019-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "290.00",
          "currency": "USD",
          "display_amount": "$290.00",
          "amount_in_cents": 29000,
          "compare_at_amount_in_cents": 33350,
          "display_compare_at_amount": "$333.50"
        },
        "original_price": {
          "amount": "290.00",
          "currency": "USD",
          "display_amount": "$290.00",
          "amount_in_cents": 29000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_19_9",
        "product_id": "prod_mirza_office_footwear_19",
        "is_master": false,
        "sku": "MIRZA-OFF-019-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "290.00",
          "currency": "USD",
          "display_amount": "$290.00",
          "amount_in_cents": 29000,
          "compare_at_amount_in_cents": 33350,
          "display_compare_at_amount": "$333.50"
        },
        "original_price": {
          "amount": "290.00",
          "currency": "USD",
          "display_amount": "$290.00",
          "amount_in_cents": 29000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_office_footwear_19_10",
        "product_id": "prod_mirza_office_footwear_19",
        "is_master": false,
        "sku": "MIRZA-OFF-019-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "290.00",
          "currency": "USD",
          "display_amount": "$290.00",
          "amount_in_cents": 29000,
          "compare_at_amount_in_cents": 33350,
          "display_compare_at_amount": "$333.50"
        },
        "original_price": {
          "amount": "290.00",
          "currency": "USD",
          "display_amount": "$290.00",
          "amount_in_cents": 29000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_20",
    "name": "The Royal Dabka Zardozi Jutti",
    "slug": "traditional-footwear-20",
    "sku": "MIRZA-TRD-020",
    "description": "Hand-embroidered with authentic gold Dabka wire and Zardozi floral motifs on midnight blue velvet.",
    "description_html": "<p>Hand-embroidered with authentic gold Dabka wire and Zardozi floral motifs on midnight blue velvet.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Royal Dabka Zardozi Jutti | Mirza Footwear",
    "meta_description": "Hand-embroidered with authentic gold Dabka wire and Zardozi floral motifs on midnight blue velvet.",
    "meta_keywords": "The Royal Dabka Zardozi Jutti, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-20/e20f1312/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_20_1",
      "url": "/products/traditional-footwear-20/e20f1312/card-lg-640.webp",
      "alt": "The Royal Dabka Zardozi Jutti",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-20/e20f1312/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-20/e20f1312/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-20/e20f1312/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-20/e20f1312/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-20/e20f1312/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_20_7",
        "var_traditional_footwear_20_8",
        "var_traditional_footwear_20_9",
        "var_traditional_footwear_20_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_20_1",
        "url": "/products/traditional-footwear-20/e20f1312/card-lg-640.webp",
        "alt": "The Royal Dabka Zardozi Jutti",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-20/e20f1312/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-20/e20f1312/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-20/e20f1312/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-20/e20f1312/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-20/e20f1312/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_20_7",
          "var_traditional_footwear_20_8",
          "var_traditional_footwear_20_9",
          "var_traditional_footwear_20_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-20/e20f1312/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAAAwAgCdASoQABAABUB8JZQC7AEPhxLj0wUrAAD+m+1RDxrWy4mNvgC7TIuhNhhF+mhsNoQBZG5pwEFXKi7XInofo2zzMc8T+mvdBIaXI0MJBygAAAA=",
      "dominantColor": "#080808",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-20/e20f1312/thumb-160.avif",
          "webp": "/products/traditional-footwear-20/e20f1312/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-20/e20f1312/card-sm-320.avif",
          "webp": "/products/traditional-footwear-20/e20f1312/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-20/e20f1312/card-480.avif",
          "webp": "/products/traditional-footwear-20/e20f1312/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-20/e20f1312/card-lg-640.avif",
          "webp": "/products/traditional-footwear-20/e20f1312/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-20/e20f1312/pdp-960.avif",
          "webp": "/products/traditional-footwear-20/e20f1312/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-20/e20f1312/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-20/e20f1312/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-20/e20f1312/zoom-1600.avif",
          "webp": "/products/traditional-footwear-20/e20f1312/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "210.00",
      "currency": "USD",
      "display_amount": "$210.00",
      "amount_in_cents": 21000,
      "compare_at_amount": "241.50",
      "compare_at_amount_in_cents": 24150,
      "display_compare_at_amount": "$241.50"
    },
    "original_price": {
      "amount": "210.00",
      "currency": "USD",
      "display_amount": "$210.00",
      "amount_in_cents": 21000
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_20_8",
    "default_variant": {
      "id": "var_traditional_footwear_20_8",
      "product_id": "prod_mirza_traditional_footwear_20",
      "is_master": true,
      "sku": "MIRZA-TRD-020-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "210.00",
        "currency": "USD",
        "display_amount": "$210.00",
        "amount_in_cents": 21000,
        "compare_at_amount_in_cents": 24150,
        "display_compare_at_amount": "$241.50"
      },
      "original_price": {
        "amount": "210.00",
        "currency": "USD",
        "display_amount": "$210.00",
        "amount_in_cents": 21000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_20_7",
        "product_id": "prod_mirza_traditional_footwear_20",
        "is_master": false,
        "sku": "MIRZA-TRD-020-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "210.00",
          "currency": "USD",
          "display_amount": "$210.00",
          "amount_in_cents": 21000,
          "compare_at_amount_in_cents": 24150,
          "display_compare_at_amount": "$241.50"
        },
        "original_price": {
          "amount": "210.00",
          "currency": "USD",
          "display_amount": "$210.00",
          "amount_in_cents": 21000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_20_8",
        "product_id": "prod_mirza_traditional_footwear_20",
        "is_master": true,
        "sku": "MIRZA-TRD-020-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "210.00",
          "currency": "USD",
          "display_amount": "$210.00",
          "amount_in_cents": 21000,
          "compare_at_amount_in_cents": 24150,
          "display_compare_at_amount": "$241.50"
        },
        "original_price": {
          "amount": "210.00",
          "currency": "USD",
          "display_amount": "$210.00",
          "amount_in_cents": 21000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_20_9",
        "product_id": "prod_mirza_traditional_footwear_20",
        "is_master": false,
        "sku": "MIRZA-TRD-020-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "210.00",
          "currency": "USD",
          "display_amount": "$210.00",
          "amount_in_cents": 21000,
          "compare_at_amount_in_cents": 24150,
          "display_compare_at_amount": "$241.50"
        },
        "original_price": {
          "amount": "210.00",
          "currency": "USD",
          "display_amount": "$210.00",
          "amount_in_cents": 21000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_20_10",
        "product_id": "prod_mirza_traditional_footwear_20",
        "is_master": false,
        "sku": "MIRZA-TRD-020-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "210.00",
          "currency": "USD",
          "display_amount": "$210.00",
          "amount_in_cents": 21000,
          "compare_at_amount_in_cents": 24150,
          "display_compare_at_amount": "$241.50"
        },
        "original_price": {
          "amount": "210.00",
          "currency": "USD",
          "display_amount": "$210.00",
          "amount_in_cents": 21000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_21",
    "name": "The Ceremonial Velvet Mojari",
    "slug": "traditional-footwear-21",
    "sku": "MIRZA-TRD-021",
    "description": "Curled-toe celebratory mojari with intricate silver Resham embroidery on rich crimson velvet.",
    "description_html": "<p>Curled-toe celebratory mojari with intricate silver Resham embroidery on rich crimson velvet.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Ceremonial Velvet Mojari | Mirza Footwear",
    "meta_description": "Curled-toe celebratory mojari with intricate silver Resham embroidery on rich crimson velvet.",
    "meta_keywords": "The Ceremonial Velvet Mojari, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-21/db1e2a3b/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_21_1",
      "url": "/products/traditional-footwear-21/db1e2a3b/card-lg-640.webp",
      "alt": "The Ceremonial Velvet Mojari",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-21/db1e2a3b/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-21/db1e2a3b/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-21/db1e2a3b/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-21/db1e2a3b/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-21/db1e2a3b/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_21_7",
        "var_traditional_footwear_21_8",
        "var_traditional_footwear_21_9",
        "var_traditional_footwear_21_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_21_1",
        "url": "/products/traditional-footwear-21/db1e2a3b/card-lg-640.webp",
        "alt": "The Ceremonial Velvet Mojari",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-21/db1e2a3b/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-21/db1e2a3b/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-21/db1e2a3b/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-21/db1e2a3b/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-21/db1e2a3b/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_21_7",
          "var_traditional_footwear_21_8",
          "var_traditional_footwear_21_9",
          "var_traditional_footwear_21_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-21/db1e2a3b/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAAAQAgCdASoQABAABUB8JZwAApNjFmDgfJkAAPl9zg/xILBujfN0LilsodrK4N8/4quHIo3nWjuOaBm2XgChC0a3hYm9hxxzIhMnP5NVt4g+KRjMUd0VZg6DS4EAAA==",
      "dominantColor": "#a8a8a8",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-21/db1e2a3b/thumb-160.avif",
          "webp": "/products/traditional-footwear-21/db1e2a3b/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-21/db1e2a3b/card-sm-320.avif",
          "webp": "/products/traditional-footwear-21/db1e2a3b/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-21/db1e2a3b/card-480.avif",
          "webp": "/products/traditional-footwear-21/db1e2a3b/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-21/db1e2a3b/card-lg-640.avif",
          "webp": "/products/traditional-footwear-21/db1e2a3b/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-21/db1e2a3b/pdp-960.avif",
          "webp": "/products/traditional-footwear-21/db1e2a3b/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-21/db1e2a3b/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-21/db1e2a3b/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-21/db1e2a3b/zoom-1600.avif",
          "webp": "/products/traditional-footwear-21/db1e2a3b/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "225.00",
      "currency": "USD",
      "display_amount": "$225.00",
      "amount_in_cents": 22500,
      "compare_at_amount": "258.75",
      "compare_at_amount_in_cents": 25875,
      "display_compare_at_amount": "$258.75"
    },
    "original_price": {
      "amount": "225.00",
      "currency": "USD",
      "display_amount": "$225.00",
      "amount_in_cents": 22500
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_21_8",
    "default_variant": {
      "id": "var_traditional_footwear_21_8",
      "product_id": "prod_mirza_traditional_footwear_21",
      "is_master": true,
      "sku": "MIRZA-TRD-021-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "225.00",
        "currency": "USD",
        "display_amount": "$225.00",
        "amount_in_cents": 22500,
        "compare_at_amount_in_cents": 25875,
        "display_compare_at_amount": "$258.75"
      },
      "original_price": {
        "amount": "225.00",
        "currency": "USD",
        "display_amount": "$225.00",
        "amount_in_cents": 22500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_21_7",
        "product_id": "prod_mirza_traditional_footwear_21",
        "is_master": false,
        "sku": "MIRZA-TRD-021-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "225.00",
          "currency": "USD",
          "display_amount": "$225.00",
          "amount_in_cents": 22500,
          "compare_at_amount_in_cents": 25875,
          "display_compare_at_amount": "$258.75"
        },
        "original_price": {
          "amount": "225.00",
          "currency": "USD",
          "display_amount": "$225.00",
          "amount_in_cents": 22500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_21_8",
        "product_id": "prod_mirza_traditional_footwear_21",
        "is_master": true,
        "sku": "MIRZA-TRD-021-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "225.00",
          "currency": "USD",
          "display_amount": "$225.00",
          "amount_in_cents": 22500,
          "compare_at_amount_in_cents": 25875,
          "display_compare_at_amount": "$258.75"
        },
        "original_price": {
          "amount": "225.00",
          "currency": "USD",
          "display_amount": "$225.00",
          "amount_in_cents": 22500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_21_9",
        "product_id": "prod_mirza_traditional_footwear_21",
        "is_master": false,
        "sku": "MIRZA-TRD-021-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "225.00",
          "currency": "USD",
          "display_amount": "$225.00",
          "amount_in_cents": 22500,
          "compare_at_amount_in_cents": 25875,
          "display_compare_at_amount": "$258.75"
        },
        "original_price": {
          "amount": "225.00",
          "currency": "USD",
          "display_amount": "$225.00",
          "amount_in_cents": 22500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_21_10",
        "product_id": "prod_mirza_traditional_footwear_21",
        "is_master": false,
        "sku": "MIRZA-TRD-021-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "225.00",
          "currency": "USD",
          "display_amount": "$225.00",
          "amount_in_cents": 22500,
          "compare_at_amount_in_cents": 25875,
          "display_compare_at_amount": "$258.75"
        },
        "original_price": {
          "amount": "225.00",
          "currency": "USD",
          "display_amount": "$225.00",
          "amount_in_cents": 22500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_22",
    "name": "The Handcrafted Peshawari Sandal",
    "slug": "traditional-footwear-22",
    "sku": "MIRZA-TRD-022",
    "description": "Heritage two-piece semi-closed sandal in vegetable-tanned mustard leather with tire-sole grip.",
    "description_html": "<p>Heritage two-piece semi-closed sandal in vegetable-tanned mustard leather with tire-sole grip.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Handcrafted Peshawari Sandal | Mirza Footwear",
    "meta_description": "Heritage two-piece semi-closed sandal in vegetable-tanned mustard leather with tire-sole grip.",
    "meta_keywords": "The Handcrafted Peshawari Sandal, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-22/9fda380c/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_22_1",
      "url": "/products/traditional-footwear-22/9fda380c/card-lg-640.webp",
      "alt": "The Handcrafted Peshawari Sandal",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-22/9fda380c/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-22/9fda380c/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-22/9fda380c/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-22/9fda380c/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-22/9fda380c/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_22_7",
        "var_traditional_footwear_22_8",
        "var_traditional_footwear_22_9",
        "var_traditional_footwear_22_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_22_1",
        "url": "/products/traditional-footwear-22/9fda380c/card-lg-640.webp",
        "alt": "The Handcrafted Peshawari Sandal",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-22/9fda380c/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-22/9fda380c/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-22/9fda380c/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-22/9fda380c/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-22/9fda380c/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_22_7",
          "var_traditional_footwear_22_8",
          "var_traditional_footwear_22_9",
          "var_traditional_footwear_22_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-22/9fda380c/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmoAAABXRUJQVlA4IF4AAADwAQCdASoQABAABUB8JZQAAuP6W6G9fqwA/mzk7fwEggbtgjhlD26r1dqAFuz4XIv1of5wBMydfjrI6D1MNPLGxivKiLrpXyWg5ViRFu0HNTXwJ3BQiOPzJ7W6wAAA",
      "dominantColor": "#080808",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-22/9fda380c/thumb-160.avif",
          "webp": "/products/traditional-footwear-22/9fda380c/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-22/9fda380c/card-sm-320.avif",
          "webp": "/products/traditional-footwear-22/9fda380c/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-22/9fda380c/card-480.avif",
          "webp": "/products/traditional-footwear-22/9fda380c/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-22/9fda380c/card-lg-640.avif",
          "webp": "/products/traditional-footwear-22/9fda380c/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-22/9fda380c/pdp-960.avif",
          "webp": "/products/traditional-footwear-22/9fda380c/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-22/9fda380c/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-22/9fda380c/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-22/9fda380c/zoom-1600.avif",
          "webp": "/products/traditional-footwear-22/9fda380c/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "195.00",
      "currency": "USD",
      "display_amount": "$195.00",
      "amount_in_cents": 19500,
      "compare_at_amount": "224.25",
      "compare_at_amount_in_cents": 22425,
      "display_compare_at_amount": "$224.25"
    },
    "original_price": {
      "amount": "195.00",
      "currency": "USD",
      "display_amount": "$195.00",
      "amount_in_cents": 19500
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_22_8",
    "default_variant": {
      "id": "var_traditional_footwear_22_8",
      "product_id": "prod_mirza_traditional_footwear_22",
      "is_master": true,
      "sku": "MIRZA-TRD-022-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "195.00",
        "currency": "USD",
        "display_amount": "$195.00",
        "amount_in_cents": 19500,
        "compare_at_amount_in_cents": 22425,
        "display_compare_at_amount": "$224.25"
      },
      "original_price": {
        "amount": "195.00",
        "currency": "USD",
        "display_amount": "$195.00",
        "amount_in_cents": 19500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_22_7",
        "product_id": "prod_mirza_traditional_footwear_22",
        "is_master": false,
        "sku": "MIRZA-TRD-022-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "195.00",
          "currency": "USD",
          "display_amount": "$195.00",
          "amount_in_cents": 19500,
          "compare_at_amount_in_cents": 22425,
          "display_compare_at_amount": "$224.25"
        },
        "original_price": {
          "amount": "195.00",
          "currency": "USD",
          "display_amount": "$195.00",
          "amount_in_cents": 19500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_22_8",
        "product_id": "prod_mirza_traditional_footwear_22",
        "is_master": true,
        "sku": "MIRZA-TRD-022-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "195.00",
          "currency": "USD",
          "display_amount": "$195.00",
          "amount_in_cents": 19500,
          "compare_at_amount_in_cents": 22425,
          "display_compare_at_amount": "$224.25"
        },
        "original_price": {
          "amount": "195.00",
          "currency": "USD",
          "display_amount": "$195.00",
          "amount_in_cents": 19500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_22_9",
        "product_id": "prod_mirza_traditional_footwear_22",
        "is_master": false,
        "sku": "MIRZA-TRD-022-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "195.00",
          "currency": "USD",
          "display_amount": "$195.00",
          "amount_in_cents": 19500,
          "compare_at_amount_in_cents": 22425,
          "display_compare_at_amount": "$224.25"
        },
        "original_price": {
          "amount": "195.00",
          "currency": "USD",
          "display_amount": "$195.00",
          "amount_in_cents": 19500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_22_10",
        "product_id": "prod_mirza_traditional_footwear_22",
        "is_master": false,
        "sku": "MIRZA-TRD-022-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "195.00",
          "currency": "USD",
          "display_amount": "$195.00",
          "amount_in_cents": 19500,
          "compare_at_amount_in_cents": 22425,
          "display_compare_at_amount": "$224.25"
        },
        "original_price": {
          "amount": "195.00",
          "currency": "USD",
          "display_amount": "$195.00",
          "amount_in_cents": 19500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_23",
    "name": "The Artisan Kolhapuri Chappal",
    "slug": "traditional-footwear-23",
    "sku": "MIRZA-TRD-023",
    "description": "Authentic hand-braided leather chappal made from untreated raw leather using age-old tanning techniques.",
    "description_html": "<p>Authentic hand-braided leather chappal made from untreated raw leather using age-old tanning techniques.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Artisan Kolhapuri Chappal | Mirza Footwear",
    "meta_description": "Authentic hand-braided leather chappal made from untreated raw leather using age-old tanning techniques.",
    "meta_keywords": "The Artisan Kolhapuri Chappal, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-23/1348e1cb/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_23_1",
      "url": "/products/traditional-footwear-23/1348e1cb/card-lg-640.webp",
      "alt": "The Artisan Kolhapuri Chappal",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-23/1348e1cb/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-23/1348e1cb/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-23/1348e1cb/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-23/1348e1cb/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-23/1348e1cb/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_23_7",
        "var_traditional_footwear_23_8",
        "var_traditional_footwear_23_9",
        "var_traditional_footwear_23_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_23_1",
        "url": "/products/traditional-footwear-23/1348e1cb/card-lg-640.webp",
        "alt": "The Artisan Kolhapuri Chappal",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-23/1348e1cb/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-23/1348e1cb/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-23/1348e1cb/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-23/1348e1cb/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-23/1348e1cb/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_23_7",
          "var_traditional_footwear_23_8",
          "var_traditional_footwear_23_9",
          "var_traditional_footwear_23_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-23/1348e1cb/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRnAAAABXRUJQVlA4IGQAAADwAQCdASoQABAABUB8JZwAApNBVtJutYAA/rgpuvo1Ct3cjkolUM4z812XQXelsneLnJhgX2Tf0FPXwxVlbjmwmb0eQ5sMP7zghShazkBfwF+5Z4Lw2CyH89dUsiyoGJBcaFAA",
      "dominantColor": "#080808",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-23/1348e1cb/thumb-160.avif",
          "webp": "/products/traditional-footwear-23/1348e1cb/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-23/1348e1cb/card-sm-320.avif",
          "webp": "/products/traditional-footwear-23/1348e1cb/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-23/1348e1cb/card-480.avif",
          "webp": "/products/traditional-footwear-23/1348e1cb/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-23/1348e1cb/card-lg-640.avif",
          "webp": "/products/traditional-footwear-23/1348e1cb/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-23/1348e1cb/pdp-960.avif",
          "webp": "/products/traditional-footwear-23/1348e1cb/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-23/1348e1cb/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-23/1348e1cb/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-23/1348e1cb/zoom-1600.avif",
          "webp": "/products/traditional-footwear-23/1348e1cb/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "180.00",
      "currency": "USD",
      "display_amount": "$180.00",
      "amount_in_cents": 18000,
      "compare_at_amount": "207.00",
      "compare_at_amount_in_cents": 20700,
      "display_compare_at_amount": "$207.00"
    },
    "original_price": {
      "amount": "180.00",
      "currency": "USD",
      "display_amount": "$180.00",
      "amount_in_cents": 18000
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_23_8",
    "default_variant": {
      "id": "var_traditional_footwear_23_8",
      "product_id": "prod_mirza_traditional_footwear_23",
      "is_master": true,
      "sku": "MIRZA-TRD-023-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "180.00",
        "currency": "USD",
        "display_amount": "$180.00",
        "amount_in_cents": 18000,
        "compare_at_amount_in_cents": 20700,
        "display_compare_at_amount": "$207.00"
      },
      "original_price": {
        "amount": "180.00",
        "currency": "USD",
        "display_amount": "$180.00",
        "amount_in_cents": 18000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_23_7",
        "product_id": "prod_mirza_traditional_footwear_23",
        "is_master": false,
        "sku": "MIRZA-TRD-023-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "180.00",
          "currency": "USD",
          "display_amount": "$180.00",
          "amount_in_cents": 18000,
          "compare_at_amount_in_cents": 20700,
          "display_compare_at_amount": "$207.00"
        },
        "original_price": {
          "amount": "180.00",
          "currency": "USD",
          "display_amount": "$180.00",
          "amount_in_cents": 18000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_23_8",
        "product_id": "prod_mirza_traditional_footwear_23",
        "is_master": true,
        "sku": "MIRZA-TRD-023-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "180.00",
          "currency": "USD",
          "display_amount": "$180.00",
          "amount_in_cents": 18000,
          "compare_at_amount_in_cents": 20700,
          "display_compare_at_amount": "$207.00"
        },
        "original_price": {
          "amount": "180.00",
          "currency": "USD",
          "display_amount": "$180.00",
          "amount_in_cents": 18000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_23_9",
        "product_id": "prod_mirza_traditional_footwear_23",
        "is_master": false,
        "sku": "MIRZA-TRD-023-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "180.00",
          "currency": "USD",
          "display_amount": "$180.00",
          "amount_in_cents": 18000,
          "compare_at_amount_in_cents": 20700,
          "display_compare_at_amount": "$207.00"
        },
        "original_price": {
          "amount": "180.00",
          "currency": "USD",
          "display_amount": "$180.00",
          "amount_in_cents": 18000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_23_10",
        "product_id": "prod_mirza_traditional_footwear_23",
        "is_master": false,
        "sku": "MIRZA-TRD-023-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "180.00",
          "currency": "USD",
          "display_amount": "$180.00",
          "amount_in_cents": 18000,
          "compare_at_amount_in_cents": 20700,
          "display_compare_at_amount": "$207.00"
        },
        "original_price": {
          "amount": "180.00",
          "currency": "USD",
          "display_amount": "$180.00",
          "amount_in_cents": 18000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_24",
    "name": "The Maharaja Gold Embroidered Jutti",
    "slug": "traditional-footwear-24",
    "sku": "MIRZA-TRD-024",
    "description": "Opulent wedding jutti covered in high-density gold zari work with cushioned leather footbed.",
    "description_html": "<p>Opulent wedding jutti covered in high-density gold zari work with cushioned leather footbed.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Maharaja Gold Embroidered Jutti | Mirza Footwear",
    "meta_description": "Opulent wedding jutti covered in high-density gold zari work with cushioned leather footbed.",
    "meta_keywords": "The Maharaja Gold Embroidered Jutti, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-24/e6536d0b/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_24_1",
      "url": "/products/traditional-footwear-24/e6536d0b/card-lg-640.webp",
      "alt": "The Maharaja Gold Embroidered Jutti",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-24/e6536d0b/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-24/e6536d0b/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-24/e6536d0b/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-24/e6536d0b/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-24/e6536d0b/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_24_7",
        "var_traditional_footwear_24_8",
        "var_traditional_footwear_24_9",
        "var_traditional_footwear_24_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_24_1",
        "url": "/products/traditional-footwear-24/e6536d0b/card-lg-640.webp",
        "alt": "The Maharaja Gold Embroidered Jutti",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-24/e6536d0b/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-24/e6536d0b/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-24/e6536d0b/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-24/e6536d0b/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-24/e6536d0b/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_24_7",
          "var_traditional_footwear_24_8",
          "var_traditional_footwear_24_9",
          "var_traditional_footwear_24_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-24/e6536d0b/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAAAQAgCdASoQABAABUB8JZwAApNTP3xK/NAAAP64K2ePr7sl+MUcAznzskVNgwbqMPqr1ugCUXQfCc+fgrjeU6e/7faf321UlVIWg/3Aw/SOAAAA",
      "dominantColor": "#181818",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-24/e6536d0b/thumb-160.avif",
          "webp": "/products/traditional-footwear-24/e6536d0b/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-24/e6536d0b/card-sm-320.avif",
          "webp": "/products/traditional-footwear-24/e6536d0b/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-24/e6536d0b/card-480.avif",
          "webp": "/products/traditional-footwear-24/e6536d0b/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-24/e6536d0b/card-lg-640.avif",
          "webp": "/products/traditional-footwear-24/e6536d0b/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-24/e6536d0b/pdp-960.avif",
          "webp": "/products/traditional-footwear-24/e6536d0b/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-24/e6536d0b/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-24/e6536d0b/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-24/e6536d0b/zoom-1600.avif",
          "webp": "/products/traditional-footwear-24/e6536d0b/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "250.00",
      "currency": "USD",
      "display_amount": "$250.00",
      "amount_in_cents": 25000,
      "compare_at_amount": "287.50",
      "compare_at_amount_in_cents": 28750,
      "display_compare_at_amount": "$287.50"
    },
    "original_price": {
      "amount": "250.00",
      "currency": "USD",
      "display_amount": "$250.00",
      "amount_in_cents": 25000
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_24_8",
    "default_variant": {
      "id": "var_traditional_footwear_24_8",
      "product_id": "prod_mirza_traditional_footwear_24",
      "is_master": true,
      "sku": "MIRZA-TRD-024-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "250.00",
        "currency": "USD",
        "display_amount": "$250.00",
        "amount_in_cents": 25000,
        "compare_at_amount_in_cents": 28750,
        "display_compare_at_amount": "$287.50"
      },
      "original_price": {
        "amount": "250.00",
        "currency": "USD",
        "display_amount": "$250.00",
        "amount_in_cents": 25000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_24_7",
        "product_id": "prod_mirza_traditional_footwear_24",
        "is_master": false,
        "sku": "MIRZA-TRD-024-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "250.00",
          "currency": "USD",
          "display_amount": "$250.00",
          "amount_in_cents": 25000,
          "compare_at_amount_in_cents": 28750,
          "display_compare_at_amount": "$287.50"
        },
        "original_price": {
          "amount": "250.00",
          "currency": "USD",
          "display_amount": "$250.00",
          "amount_in_cents": 25000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_24_8",
        "product_id": "prod_mirza_traditional_footwear_24",
        "is_master": true,
        "sku": "MIRZA-TRD-024-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "250.00",
          "currency": "USD",
          "display_amount": "$250.00",
          "amount_in_cents": 25000,
          "compare_at_amount_in_cents": 28750,
          "display_compare_at_amount": "$287.50"
        },
        "original_price": {
          "amount": "250.00",
          "currency": "USD",
          "display_amount": "$250.00",
          "amount_in_cents": 25000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_24_9",
        "product_id": "prod_mirza_traditional_footwear_24",
        "is_master": false,
        "sku": "MIRZA-TRD-024-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "250.00",
          "currency": "USD",
          "display_amount": "$250.00",
          "amount_in_cents": 25000,
          "compare_at_amount_in_cents": 28750,
          "display_compare_at_amount": "$287.50"
        },
        "original_price": {
          "amount": "250.00",
          "currency": "USD",
          "display_amount": "$250.00",
          "amount_in_cents": 25000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_24_10",
        "product_id": "prod_mirza_traditional_footwear_24",
        "is_master": false,
        "sku": "MIRZA-TRD-024-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "250.00",
          "currency": "USD",
          "display_amount": "$250.00",
          "amount_in_cents": 25000,
          "compare_at_amount_in_cents": 28750,
          "display_compare_at_amount": "$287.50"
        },
        "original_price": {
          "amount": "250.00",
          "currency": "USD",
          "display_amount": "$250.00",
          "amount_in_cents": 25000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_25",
    "name": "The Moghul Silk Brocade Mojari",
    "slug": "traditional-footwear-25",
    "sku": "MIRZA-TRD-025",
    "description": "Crafted from handloom Banarasi silk brocade featuring intricate floral booti patterns.",
    "description_html": "<p>Crafted from handloom Banarasi silk brocade featuring intricate floral booti patterns.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Moghul Silk Brocade Mojari | Mirza Footwear",
    "meta_description": "Crafted from handloom Banarasi silk brocade featuring intricate floral booti patterns.",
    "meta_keywords": "The Moghul Silk Brocade Mojari, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-25/27da466f/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_25_1",
      "url": "/products/traditional-footwear-25/27da466f/card-lg-640.webp",
      "alt": "The Moghul Silk Brocade Mojari",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-25/27da466f/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-25/27da466f/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-25/27da466f/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-25/27da466f/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-25/27da466f/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_25_7",
        "var_traditional_footwear_25_8",
        "var_traditional_footwear_25_9",
        "var_traditional_footwear_25_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_25_1",
        "url": "/products/traditional-footwear-25/27da466f/card-lg-640.webp",
        "alt": "The Moghul Silk Brocade Mojari",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-25/27da466f/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-25/27da466f/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-25/27da466f/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-25/27da466f/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-25/27da466f/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_25_7",
          "var_traditional_footwear_25_8",
          "var_traditional_footwear_25_9",
          "var_traditional_footwear_25_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-25/27da466f/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoQABAABUB8JZwAApMmjQkpwAD5fJ8v31WIkiJCYvPF93R9WsMJza8GuxhKSdNlI6/yFj4DXD8ajBH6P4KlBZmlAQAAAA==",
      "dominantColor": "#989898",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-25/27da466f/thumb-160.avif",
          "webp": "/products/traditional-footwear-25/27da466f/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-25/27da466f/card-sm-320.avif",
          "webp": "/products/traditional-footwear-25/27da466f/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-25/27da466f/card-480.avif",
          "webp": "/products/traditional-footwear-25/27da466f/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-25/27da466f/card-lg-640.avif",
          "webp": "/products/traditional-footwear-25/27da466f/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-25/27da466f/pdp-960.avif",
          "webp": "/products/traditional-footwear-25/27da466f/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-25/27da466f/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-25/27da466f/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-25/27da466f/zoom-1600.avif",
          "webp": "/products/traditional-footwear-25/27da466f/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "230.00",
      "currency": "USD",
      "display_amount": "$230.00",
      "amount_in_cents": 23000,
      "compare_at_amount": "264.50",
      "compare_at_amount_in_cents": 26450,
      "display_compare_at_amount": "$264.50"
    },
    "original_price": {
      "amount": "230.00",
      "currency": "USD",
      "display_amount": "$230.00",
      "amount_in_cents": 23000
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_25_8",
    "default_variant": {
      "id": "var_traditional_footwear_25_8",
      "product_id": "prod_mirza_traditional_footwear_25",
      "is_master": true,
      "sku": "MIRZA-TRD-025-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "230.00",
        "currency": "USD",
        "display_amount": "$230.00",
        "amount_in_cents": 23000,
        "compare_at_amount_in_cents": 26450,
        "display_compare_at_amount": "$264.50"
      },
      "original_price": {
        "amount": "230.00",
        "currency": "USD",
        "display_amount": "$230.00",
        "amount_in_cents": 23000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_25_7",
        "product_id": "prod_mirza_traditional_footwear_25",
        "is_master": false,
        "sku": "MIRZA-TRD-025-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "230.00",
          "currency": "USD",
          "display_amount": "$230.00",
          "amount_in_cents": 23000,
          "compare_at_amount_in_cents": 26450,
          "display_compare_at_amount": "$264.50"
        },
        "original_price": {
          "amount": "230.00",
          "currency": "USD",
          "display_amount": "$230.00",
          "amount_in_cents": 23000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_25_8",
        "product_id": "prod_mirza_traditional_footwear_25",
        "is_master": true,
        "sku": "MIRZA-TRD-025-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "230.00",
          "currency": "USD",
          "display_amount": "$230.00",
          "amount_in_cents": 23000,
          "compare_at_amount_in_cents": 26450,
          "display_compare_at_amount": "$264.50"
        },
        "original_price": {
          "amount": "230.00",
          "currency": "USD",
          "display_amount": "$230.00",
          "amount_in_cents": 23000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_25_9",
        "product_id": "prod_mirza_traditional_footwear_25",
        "is_master": false,
        "sku": "MIRZA-TRD-025-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "230.00",
          "currency": "USD",
          "display_amount": "$230.00",
          "amount_in_cents": 23000,
          "compare_at_amount_in_cents": 26450,
          "display_compare_at_amount": "$264.50"
        },
        "original_price": {
          "amount": "230.00",
          "currency": "USD",
          "display_amount": "$230.00",
          "amount_in_cents": 23000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_25_10",
        "product_id": "prod_mirza_traditional_footwear_25",
        "is_master": false,
        "sku": "MIRZA-TRD-025-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "230.00",
          "currency": "USD",
          "display_amount": "$230.00",
          "amount_in_cents": 23000,
          "compare_at_amount_in_cents": 26450,
          "display_compare_at_amount": "$264.50"
        },
        "original_price": {
          "amount": "230.00",
          "currency": "USD",
          "display_amount": "$230.00",
          "amount_in_cents": 23000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_26",
    "name": "The Regal Tilla Work Jutti",
    "slug": "traditional-footwear-26",
    "sku": "MIRZA-TRD-026",
    "description": "Traditional Kashmiri tilla needlework in geometric arabesque patterns on supple camel leather.",
    "description_html": "<p>Traditional Kashmiri tilla needlework in geometric arabesque patterns on supple camel leather.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Regal Tilla Work Jutti | Mirza Footwear",
    "meta_description": "Traditional Kashmiri tilla needlework in geometric arabesque patterns on supple camel leather.",
    "meta_keywords": "The Regal Tilla Work Jutti, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-26/dd4cc04a/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_26_1",
      "url": "/products/traditional-footwear-26/dd4cc04a/card-lg-640.webp",
      "alt": "The Regal Tilla Work Jutti",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-26/dd4cc04a/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-26/dd4cc04a/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-26/dd4cc04a/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-26/dd4cc04a/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-26/dd4cc04a/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_26_7",
        "var_traditional_footwear_26_8",
        "var_traditional_footwear_26_9",
        "var_traditional_footwear_26_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_26_1",
        "url": "/products/traditional-footwear-26/dd4cc04a/card-lg-640.webp",
        "alt": "The Regal Tilla Work Jutti",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-26/dd4cc04a/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-26/dd4cc04a/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-26/dd4cc04a/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-26/dd4cc04a/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-26/dd4cc04a/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_26_7",
          "var_traditional_footwear_26_8",
          "var_traditional_footwear_26_9",
          "var_traditional_footwear_26_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-26/dd4cc04a/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmwAAABXRUJQVlA4IGAAAADwAQCdASoQABAABUB8JZwAFEAQmARc4/AA/sp3iRp2YEKKwDU5wVbmeZ81pypo2GUaMASqCehVIGGwlnsi8VVDRNQnaeW2j/LMtf0ESgH55i5f5SmAcuFCp1OBtcCYQAA=",
      "dominantColor": "#382828",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-26/dd4cc04a/thumb-160.avif",
          "webp": "/products/traditional-footwear-26/dd4cc04a/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-26/dd4cc04a/card-sm-320.avif",
          "webp": "/products/traditional-footwear-26/dd4cc04a/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-26/dd4cc04a/card-480.avif",
          "webp": "/products/traditional-footwear-26/dd4cc04a/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-26/dd4cc04a/card-lg-640.avif",
          "webp": "/products/traditional-footwear-26/dd4cc04a/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-26/dd4cc04a/pdp-960.avif",
          "webp": "/products/traditional-footwear-26/dd4cc04a/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-26/dd4cc04a/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-26/dd4cc04a/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-26/dd4cc04a/zoom-1600.avif",
          "webp": "/products/traditional-footwear-26/dd4cc04a/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "215.00",
      "currency": "USD",
      "display_amount": "$215.00",
      "amount_in_cents": 21500,
      "compare_at_amount": "247.25",
      "compare_at_amount_in_cents": 24725,
      "display_compare_at_amount": "$247.25"
    },
    "original_price": {
      "amount": "215.00",
      "currency": "USD",
      "display_amount": "$215.00",
      "amount_in_cents": 21500
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_26_8",
    "default_variant": {
      "id": "var_traditional_footwear_26_8",
      "product_id": "prod_mirza_traditional_footwear_26",
      "is_master": true,
      "sku": "MIRZA-TRD-026-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "215.00",
        "currency": "USD",
        "display_amount": "$215.00",
        "amount_in_cents": 21500,
        "compare_at_amount_in_cents": 24725,
        "display_compare_at_amount": "$247.25"
      },
      "original_price": {
        "amount": "215.00",
        "currency": "USD",
        "display_amount": "$215.00",
        "amount_in_cents": 21500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_26_7",
        "product_id": "prod_mirza_traditional_footwear_26",
        "is_master": false,
        "sku": "MIRZA-TRD-026-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "215.00",
          "currency": "USD",
          "display_amount": "$215.00",
          "amount_in_cents": 21500,
          "compare_at_amount_in_cents": 24725,
          "display_compare_at_amount": "$247.25"
        },
        "original_price": {
          "amount": "215.00",
          "currency": "USD",
          "display_amount": "$215.00",
          "amount_in_cents": 21500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_26_8",
        "product_id": "prod_mirza_traditional_footwear_26",
        "is_master": true,
        "sku": "MIRZA-TRD-026-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "215.00",
          "currency": "USD",
          "display_amount": "$215.00",
          "amount_in_cents": 21500,
          "compare_at_amount_in_cents": 24725,
          "display_compare_at_amount": "$247.25"
        },
        "original_price": {
          "amount": "215.00",
          "currency": "USD",
          "display_amount": "$215.00",
          "amount_in_cents": 21500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_26_9",
        "product_id": "prod_mirza_traditional_footwear_26",
        "is_master": false,
        "sku": "MIRZA-TRD-026-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "215.00",
          "currency": "USD",
          "display_amount": "$215.00",
          "amount_in_cents": 21500,
          "compare_at_amount_in_cents": 24725,
          "display_compare_at_amount": "$247.25"
        },
        "original_price": {
          "amount": "215.00",
          "currency": "USD",
          "display_amount": "$215.00",
          "amount_in_cents": 21500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_26_10",
        "product_id": "prod_mirza_traditional_footwear_26",
        "is_master": false,
        "sku": "MIRZA-TRD-026-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "215.00",
          "currency": "USD",
          "display_amount": "$215.00",
          "amount_in_cents": 21500,
          "compare_at_amount_in_cents": 24725,
          "display_compare_at_amount": "$247.25"
        },
        "original_price": {
          "amount": "215.00",
          "currency": "USD",
          "display_amount": "$215.00",
          "amount_in_cents": 21500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_27",
    "name": "The Classic Leather Peshawari",
    "slug": "traditional-footwear-27",
    "sku": "MIRZA-TRD-027",
    "description": "Sturdy dark walnut Peshawari sandal with cross-over leather straps and hand-waxed finish.",
    "description_html": "<p>Sturdy dark walnut Peshawari sandal with cross-over leather straps and hand-waxed finish.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Classic Leather Peshawari | Mirza Footwear",
    "meta_description": "Sturdy dark walnut Peshawari sandal with cross-over leather straps and hand-waxed finish.",
    "meta_keywords": "The Classic Leather Peshawari, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-27/622f51fd/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_27_1",
      "url": "/products/traditional-footwear-27/622f51fd/card-lg-640.webp",
      "alt": "The Classic Leather Peshawari",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-27/622f51fd/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-27/622f51fd/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-27/622f51fd/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-27/622f51fd/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-27/622f51fd/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_27_7",
        "var_traditional_footwear_27_8",
        "var_traditional_footwear_27_9",
        "var_traditional_footwear_27_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_27_1",
        "url": "/products/traditional-footwear-27/622f51fd/card-lg-640.webp",
        "alt": "The Classic Leather Peshawari",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-27/622f51fd/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-27/622f51fd/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-27/622f51fd/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-27/622f51fd/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-27/622f51fd/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_27_7",
          "var_traditional_footwear_27_8",
          "var_traditional_footwear_27_9",
          "var_traditional_footwear_27_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-27/622f51fd/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRnYAAABXRUJQVlA4IGoAAADwAQCdASoQABAABUB8JZwAAp0vcCC0TAAA/m0Mhu7z4lD4Boya/6OcfRMUuEjJacCYhISytuDQjdPVdy34XdoQHo6Z0VI4elXz3YgR8M17EfH+xbScSt71XhX3xGJ8+KAn/a3OhTCOAAAA",
      "dominantColor": "#080808",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-27/622f51fd/thumb-160.avif",
          "webp": "/products/traditional-footwear-27/622f51fd/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-27/622f51fd/card-sm-320.avif",
          "webp": "/products/traditional-footwear-27/622f51fd/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-27/622f51fd/card-480.avif",
          "webp": "/products/traditional-footwear-27/622f51fd/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-27/622f51fd/card-lg-640.avif",
          "webp": "/products/traditional-footwear-27/622f51fd/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-27/622f51fd/pdp-960.avif",
          "webp": "/products/traditional-footwear-27/622f51fd/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-27/622f51fd/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-27/622f51fd/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-27/622f51fd/zoom-1600.avif",
          "webp": "/products/traditional-footwear-27/622f51fd/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "205.00",
      "currency": "USD",
      "display_amount": "$205.00",
      "amount_in_cents": 20500,
      "compare_at_amount": "235.75",
      "compare_at_amount_in_cents": 23575,
      "display_compare_at_amount": "$235.75"
    },
    "original_price": {
      "amount": "205.00",
      "currency": "USD",
      "display_amount": "$205.00",
      "amount_in_cents": 20500
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_27_8",
    "default_variant": {
      "id": "var_traditional_footwear_27_8",
      "product_id": "prod_mirza_traditional_footwear_27",
      "is_master": true,
      "sku": "MIRZA-TRD-027-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "205.00",
        "currency": "USD",
        "display_amount": "$205.00",
        "amount_in_cents": 20500,
        "compare_at_amount_in_cents": 23575,
        "display_compare_at_amount": "$235.75"
      },
      "original_price": {
        "amount": "205.00",
        "currency": "USD",
        "display_amount": "$205.00",
        "amount_in_cents": 20500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_27_7",
        "product_id": "prod_mirza_traditional_footwear_27",
        "is_master": false,
        "sku": "MIRZA-TRD-027-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "205.00",
          "currency": "USD",
          "display_amount": "$205.00",
          "amount_in_cents": 20500,
          "compare_at_amount_in_cents": 23575,
          "display_compare_at_amount": "$235.75"
        },
        "original_price": {
          "amount": "205.00",
          "currency": "USD",
          "display_amount": "$205.00",
          "amount_in_cents": 20500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_27_8",
        "product_id": "prod_mirza_traditional_footwear_27",
        "is_master": true,
        "sku": "MIRZA-TRD-027-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "205.00",
          "currency": "USD",
          "display_amount": "$205.00",
          "amount_in_cents": 20500,
          "compare_at_amount_in_cents": 23575,
          "display_compare_at_amount": "$235.75"
        },
        "original_price": {
          "amount": "205.00",
          "currency": "USD",
          "display_amount": "$205.00",
          "amount_in_cents": 20500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_27_9",
        "product_id": "prod_mirza_traditional_footwear_27",
        "is_master": false,
        "sku": "MIRZA-TRD-027-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "205.00",
          "currency": "USD",
          "display_amount": "$205.00",
          "amount_in_cents": 20500,
          "compare_at_amount_in_cents": 23575,
          "display_compare_at_amount": "$235.75"
        },
        "original_price": {
          "amount": "205.00",
          "currency": "USD",
          "display_amount": "$205.00",
          "amount_in_cents": 20500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_27_10",
        "product_id": "prod_mirza_traditional_footwear_27",
        "is_master": false,
        "sku": "MIRZA-TRD-027-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "205.00",
          "currency": "USD",
          "display_amount": "$205.00",
          "amount_in_cents": 20500,
          "compare_at_amount_in_cents": 23575,
          "display_compare_at_amount": "$235.75"
        },
        "original_price": {
          "amount": "205.00",
          "currency": "USD",
          "display_amount": "$205.00",
          "amount_in_cents": 20500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_28",
    "name": "The Braided Kolhapuri Slide",
    "slug": "traditional-footwear-28",
    "sku": "MIRZA-TRD-028",
    "description": "Contemporary slide variant of the iconic Kolhapuri with braided toe loop and brass rivets.",
    "description_html": "<p>Contemporary slide variant of the iconic Kolhapuri with braided toe loop and brass rivets.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Braided Kolhapuri Slide | Mirza Footwear",
    "meta_description": "Contemporary slide variant of the iconic Kolhapuri with braided toe loop and brass rivets.",
    "meta_keywords": "The Braided Kolhapuri Slide, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-28/7481a413/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_28_1",
      "url": "/products/traditional-footwear-28/7481a413/card-lg-640.webp",
      "alt": "The Braided Kolhapuri Slide",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-28/7481a413/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-28/7481a413/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-28/7481a413/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-28/7481a413/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-28/7481a413/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_28_7",
        "var_traditional_footwear_28_8",
        "var_traditional_footwear_28_9",
        "var_traditional_footwear_28_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_28_1",
        "url": "/products/traditional-footwear-28/7481a413/card-lg-640.webp",
        "alt": "The Braided Kolhapuri Slide",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-28/7481a413/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-28/7481a413/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-28/7481a413/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-28/7481a413/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-28/7481a413/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_28_7",
          "var_traditional_footwear_28_8",
          "var_traditional_footwear_28_9",
          "var_traditional_footwear_28_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-28/7481a413/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRkYAAABXRUJQVlA4IDoAAACwAQCdASoQABAABUB8JYwAAhUftZ2AAP6b6X3Zv7NLObhp562ml5/qqGckroUNFq8OZdTZcnQBYAAA",
      "dominantColor": "#586878",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-28/7481a413/thumb-160.avif",
          "webp": "/products/traditional-footwear-28/7481a413/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-28/7481a413/card-sm-320.avif",
          "webp": "/products/traditional-footwear-28/7481a413/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-28/7481a413/card-480.avif",
          "webp": "/products/traditional-footwear-28/7481a413/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-28/7481a413/card-lg-640.avif",
          "webp": "/products/traditional-footwear-28/7481a413/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-28/7481a413/pdp-960.avif",
          "webp": "/products/traditional-footwear-28/7481a413/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-28/7481a413/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-28/7481a413/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-28/7481a413/zoom-1600.avif",
          "webp": "/products/traditional-footwear-28/7481a413/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "185.00",
      "currency": "USD",
      "display_amount": "$185.00",
      "amount_in_cents": 18500,
      "compare_at_amount": "212.75",
      "compare_at_amount_in_cents": 21275,
      "display_compare_at_amount": "$212.75"
    },
    "original_price": {
      "amount": "185.00",
      "currency": "USD",
      "display_amount": "$185.00",
      "amount_in_cents": 18500
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_28_8",
    "default_variant": {
      "id": "var_traditional_footwear_28_8",
      "product_id": "prod_mirza_traditional_footwear_28",
      "is_master": true,
      "sku": "MIRZA-TRD-028-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "185.00",
        "currency": "USD",
        "display_amount": "$185.00",
        "amount_in_cents": 18500,
        "compare_at_amount_in_cents": 21275,
        "display_compare_at_amount": "$212.75"
      },
      "original_price": {
        "amount": "185.00",
        "currency": "USD",
        "display_amount": "$185.00",
        "amount_in_cents": 18500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_28_7",
        "product_id": "prod_mirza_traditional_footwear_28",
        "is_master": false,
        "sku": "MIRZA-TRD-028-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "185.00",
          "currency": "USD",
          "display_amount": "$185.00",
          "amount_in_cents": 18500,
          "compare_at_amount_in_cents": 21275,
          "display_compare_at_amount": "$212.75"
        },
        "original_price": {
          "amount": "185.00",
          "currency": "USD",
          "display_amount": "$185.00",
          "amount_in_cents": 18500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_28_8",
        "product_id": "prod_mirza_traditional_footwear_28",
        "is_master": true,
        "sku": "MIRZA-TRD-028-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "185.00",
          "currency": "USD",
          "display_amount": "$185.00",
          "amount_in_cents": 18500,
          "compare_at_amount_in_cents": 21275,
          "display_compare_at_amount": "$212.75"
        },
        "original_price": {
          "amount": "185.00",
          "currency": "USD",
          "display_amount": "$185.00",
          "amount_in_cents": 18500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_28_9",
        "product_id": "prod_mirza_traditional_footwear_28",
        "is_master": false,
        "sku": "MIRZA-TRD-028-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "185.00",
          "currency": "USD",
          "display_amount": "$185.00",
          "amount_in_cents": 18500,
          "compare_at_amount_in_cents": 21275,
          "display_compare_at_amount": "$212.75"
        },
        "original_price": {
          "amount": "185.00",
          "currency": "USD",
          "display_amount": "$185.00",
          "amount_in_cents": 18500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_28_10",
        "product_id": "prod_mirza_traditional_footwear_28",
        "is_master": false,
        "sku": "MIRZA-TRD-028-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "185.00",
          "currency": "USD",
          "display_amount": "$185.00",
          "amount_in_cents": 18500,
          "compare_at_amount_in_cents": 21275,
          "display_compare_at_amount": "$212.75"
        },
        "original_price": {
          "amount": "185.00",
          "currency": "USD",
          "display_amount": "$185.00",
          "amount_in_cents": 18500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_29",
    "name": "The Shehnai Wedding Mojari",
    "slug": "traditional-footwear-29",
    "sku": "MIRZA-TRD-029",
    "description": "Ivory raw silk mojari adorned with pearl beads and golden sequins, crafted for auspicious occasions.",
    "description_html": "<p>Ivory raw silk mojari adorned with pearl beads and golden sequins, crafted for auspicious occasions.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Shehnai Wedding Mojari | Mirza Footwear",
    "meta_description": "Ivory raw silk mojari adorned with pearl beads and golden sequins, crafted for auspicious occasions.",
    "meta_keywords": "The Shehnai Wedding Mojari, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-29/55347f10/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_29_1",
      "url": "/products/traditional-footwear-29/55347f10/card-lg-640.webp",
      "alt": "The Shehnai Wedding Mojari",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-29/55347f10/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-29/55347f10/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-29/55347f10/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-29/55347f10/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-29/55347f10/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_29_7",
        "var_traditional_footwear_29_8",
        "var_traditional_footwear_29_9",
        "var_traditional_footwear_29_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_29_1",
        "url": "/products/traditional-footwear-29/55347f10/card-lg-640.webp",
        "alt": "The Shehnai Wedding Mojari",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-29/55347f10/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-29/55347f10/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-29/55347f10/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-29/55347f10/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-29/55347f10/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_29_7",
          "var_traditional_footwear_29_8",
          "var_traditional_footwear_29_9",
          "var_traditional_footwear_29_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-29/55347f10/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAACQAQCdASoQABAABUB8JZQAAh2tYaAA/tgXiTUm5EXQYzUH9t8Bsm9UikYHzv7acxtgTEhhpWSifIBwtlBggqHvnQN7DjUQpnuRZdOAKAAAAA==",
      "dominantColor": "#282828",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-29/55347f10/thumb-160.avif",
          "webp": "/products/traditional-footwear-29/55347f10/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-29/55347f10/card-sm-320.avif",
          "webp": "/products/traditional-footwear-29/55347f10/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-29/55347f10/card-480.avif",
          "webp": "/products/traditional-footwear-29/55347f10/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-29/55347f10/card-lg-640.avif",
          "webp": "/products/traditional-footwear-29/55347f10/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-29/55347f10/pdp-960.avif",
          "webp": "/products/traditional-footwear-29/55347f10/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-29/55347f10/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-29/55347f10/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-29/55347f10/zoom-1600.avif",
          "webp": "/products/traditional-footwear-29/55347f10/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "240.00",
      "currency": "USD",
      "display_amount": "$240.00",
      "amount_in_cents": 24000,
      "compare_at_amount": "276.00",
      "compare_at_amount_in_cents": 27600,
      "display_compare_at_amount": "$276.00"
    },
    "original_price": {
      "amount": "240.00",
      "currency": "USD",
      "display_amount": "$240.00",
      "amount_in_cents": 24000
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_29_8",
    "default_variant": {
      "id": "var_traditional_footwear_29_8",
      "product_id": "prod_mirza_traditional_footwear_29",
      "is_master": true,
      "sku": "MIRZA-TRD-029-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "240.00",
        "currency": "USD",
        "display_amount": "$240.00",
        "amount_in_cents": 24000,
        "compare_at_amount_in_cents": 27600,
        "display_compare_at_amount": "$276.00"
      },
      "original_price": {
        "amount": "240.00",
        "currency": "USD",
        "display_amount": "$240.00",
        "amount_in_cents": 24000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_29_7",
        "product_id": "prod_mirza_traditional_footwear_29",
        "is_master": false,
        "sku": "MIRZA-TRD-029-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "240.00",
          "currency": "USD",
          "display_amount": "$240.00",
          "amount_in_cents": 24000,
          "compare_at_amount_in_cents": 27600,
          "display_compare_at_amount": "$276.00"
        },
        "original_price": {
          "amount": "240.00",
          "currency": "USD",
          "display_amount": "$240.00",
          "amount_in_cents": 24000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_29_8",
        "product_id": "prod_mirza_traditional_footwear_29",
        "is_master": true,
        "sku": "MIRZA-TRD-029-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "240.00",
          "currency": "USD",
          "display_amount": "$240.00",
          "amount_in_cents": 24000,
          "compare_at_amount_in_cents": 27600,
          "display_compare_at_amount": "$276.00"
        },
        "original_price": {
          "amount": "240.00",
          "currency": "USD",
          "display_amount": "$240.00",
          "amount_in_cents": 24000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_29_9",
        "product_id": "prod_mirza_traditional_footwear_29",
        "is_master": false,
        "sku": "MIRZA-TRD-029-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "240.00",
          "currency": "USD",
          "display_amount": "$240.00",
          "amount_in_cents": 24000,
          "compare_at_amount_in_cents": 27600,
          "display_compare_at_amount": "$276.00"
        },
        "original_price": {
          "amount": "240.00",
          "currency": "USD",
          "display_amount": "$240.00",
          "amount_in_cents": 24000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_29_10",
        "product_id": "prod_mirza_traditional_footwear_29",
        "is_master": false,
        "sku": "MIRZA-TRD-029-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "240.00",
          "currency": "USD",
          "display_amount": "$240.00",
          "amount_in_cents": 24000,
          "compare_at_amount_in_cents": 27600,
          "display_compare_at_amount": "$276.00"
        },
        "original_price": {
          "amount": "240.00",
          "currency": "USD",
          "display_amount": "$240.00",
          "amount_in_cents": 24000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_30",
    "name": "The Noor Jahan Velvet Jutti",
    "slug": "traditional-footwear-30",
    "sku": "MIRZA-TRD-030",
    "description": "Plush emerald velvet jutti lined with soft sheepskin, featuring delicate silver gota embroidery.",
    "description_html": "<p>Plush emerald velvet jutti lined with soft sheepskin, featuring delicate silver gota embroidery.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Noor Jahan Velvet Jutti | Mirza Footwear",
    "meta_description": "Plush emerald velvet jutti lined with soft sheepskin, featuring delicate silver gota embroidery.",
    "meta_keywords": "The Noor Jahan Velvet Jutti, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-30/03c8f87e/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_30_1",
      "url": "/products/traditional-footwear-30/03c8f87e/card-lg-640.webp",
      "alt": "The Noor Jahan Velvet Jutti",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-30/03c8f87e/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-30/03c8f87e/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-30/03c8f87e/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-30/03c8f87e/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-30/03c8f87e/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_30_7",
        "var_traditional_footwear_30_8",
        "var_traditional_footwear_30_9",
        "var_traditional_footwear_30_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_30_1",
        "url": "/products/traditional-footwear-30/03c8f87e/card-lg-640.webp",
        "alt": "The Noor Jahan Velvet Jutti",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-30/03c8f87e/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-30/03c8f87e/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-30/03c8f87e/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-30/03c8f87e/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-30/03c8f87e/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_30_7",
          "var_traditional_footwear_30_8",
          "var_traditional_footwear_30_9",
          "var_traditional_footwear_30_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-30/03c8f87e/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAADQAQCdASoQABAABUB8JZwAAqHywCtmgAD+bORprhHdnGL3zsm0xYKp0M5Px2MJlr2trYTbdD/bF+CbTRPiazPYmq2Jada8YcDDf+UtjZn0dve673qDgAAA",
      "dominantColor": "#080808",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-30/03c8f87e/thumb-160.avif",
          "webp": "/products/traditional-footwear-30/03c8f87e/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-30/03c8f87e/card-sm-320.avif",
          "webp": "/products/traditional-footwear-30/03c8f87e/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-30/03c8f87e/card-480.avif",
          "webp": "/products/traditional-footwear-30/03c8f87e/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-30/03c8f87e/card-lg-640.avif",
          "webp": "/products/traditional-footwear-30/03c8f87e/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-30/03c8f87e/pdp-960.avif",
          "webp": "/products/traditional-footwear-30/03c8f87e/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-30/03c8f87e/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-30/03c8f87e/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-30/03c8f87e/zoom-1600.avif",
          "webp": "/products/traditional-footwear-30/03c8f87e/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "220.00",
      "currency": "USD",
      "display_amount": "$220.00",
      "amount_in_cents": 22000,
      "compare_at_amount": "253.00",
      "compare_at_amount_in_cents": 25300,
      "display_compare_at_amount": "$253.00"
    },
    "original_price": {
      "amount": "220.00",
      "currency": "USD",
      "display_amount": "$220.00",
      "amount_in_cents": 22000
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_30_8",
    "default_variant": {
      "id": "var_traditional_footwear_30_8",
      "product_id": "prod_mirza_traditional_footwear_30",
      "is_master": true,
      "sku": "MIRZA-TRD-030-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "220.00",
        "currency": "USD",
        "display_amount": "$220.00",
        "amount_in_cents": 22000,
        "compare_at_amount_in_cents": 25300,
        "display_compare_at_amount": "$253.00"
      },
      "original_price": {
        "amount": "220.00",
        "currency": "USD",
        "display_amount": "$220.00",
        "amount_in_cents": 22000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_30_7",
        "product_id": "prod_mirza_traditional_footwear_30",
        "is_master": false,
        "sku": "MIRZA-TRD-030-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "220.00",
          "currency": "USD",
          "display_amount": "$220.00",
          "amount_in_cents": 22000,
          "compare_at_amount_in_cents": 25300,
          "display_compare_at_amount": "$253.00"
        },
        "original_price": {
          "amount": "220.00",
          "currency": "USD",
          "display_amount": "$220.00",
          "amount_in_cents": 22000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_30_8",
        "product_id": "prod_mirza_traditional_footwear_30",
        "is_master": true,
        "sku": "MIRZA-TRD-030-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "220.00",
          "currency": "USD",
          "display_amount": "$220.00",
          "amount_in_cents": 22000,
          "compare_at_amount_in_cents": 25300,
          "display_compare_at_amount": "$253.00"
        },
        "original_price": {
          "amount": "220.00",
          "currency": "USD",
          "display_amount": "$220.00",
          "amount_in_cents": 22000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_30_9",
        "product_id": "prod_mirza_traditional_footwear_30",
        "is_master": false,
        "sku": "MIRZA-TRD-030-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "220.00",
          "currency": "USD",
          "display_amount": "$220.00",
          "amount_in_cents": 22000,
          "compare_at_amount_in_cents": 25300,
          "display_compare_at_amount": "$253.00"
        },
        "original_price": {
          "amount": "220.00",
          "currency": "USD",
          "display_amount": "$220.00",
          "amount_in_cents": 22000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_30_10",
        "product_id": "prod_mirza_traditional_footwear_30",
        "is_master": false,
        "sku": "MIRZA-TRD-030-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "220.00",
          "currency": "USD",
          "display_amount": "$220.00",
          "amount_in_cents": 22000,
          "compare_at_amount_in_cents": 25300,
          "display_compare_at_amount": "$253.00"
        },
        "original_price": {
          "amount": "220.00",
          "currency": "USD",
          "display_amount": "$220.00",
          "amount_in_cents": 22000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_31",
    "name": "The Jodhpur Hand-Tooled Jutti",
    "slug": "traditional-footwear-31",
    "sku": "MIRZA-TRD-031",
    "description": "Richly embossed leather jutti handcrafted by master artisans in Rajasthan.",
    "description_html": "<p>Richly embossed leather jutti handcrafted by master artisans in Rajasthan.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Jodhpur Hand-Tooled Jutti | Mirza Footwear",
    "meta_description": "Richly embossed leather jutti handcrafted by master artisans in Rajasthan.",
    "meta_keywords": "The Jodhpur Hand-Tooled Jutti, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-31/8cefed5f/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_31_1",
      "url": "/products/traditional-footwear-31/8cefed5f/card-lg-640.webp",
      "alt": "The Jodhpur Hand-Tooled Jutti",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-31/8cefed5f/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-31/8cefed5f/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-31/8cefed5f/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-31/8cefed5f/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-31/8cefed5f/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_31_7",
        "var_traditional_footwear_31_8",
        "var_traditional_footwear_31_9",
        "var_traditional_footwear_31_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_31_1",
        "url": "/products/traditional-footwear-31/8cefed5f/card-lg-640.webp",
        "alt": "The Jodhpur Hand-Tooled Jutti",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-31/8cefed5f/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-31/8cefed5f/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-31/8cefed5f/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-31/8cefed5f/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-31/8cefed5f/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_31_7",
          "var_traditional_footwear_31_8",
          "var_traditional_footwear_31_9",
          "var_traditional_footwear_31_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-31/8cefed5f/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRnAAAABXRUJQVlA4IGQAAACQAgCdASoQABAABUB8JQBOj+EEA2wAHaPVIF1+gAD+bPBbQ+noh5WMqaWY28512Tq3X6/zxIfkmSgmopCv6Pi4+Tka/4L3ARD9V7X5+nlG7zvS3GhdD8mNekedPttV31/p+EAA",
      "dominantColor": "#080808",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-31/8cefed5f/thumb-160.avif",
          "webp": "/products/traditional-footwear-31/8cefed5f/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-31/8cefed5f/card-sm-320.avif",
          "webp": "/products/traditional-footwear-31/8cefed5f/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-31/8cefed5f/card-480.avif",
          "webp": "/products/traditional-footwear-31/8cefed5f/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-31/8cefed5f/card-lg-640.avif",
          "webp": "/products/traditional-footwear-31/8cefed5f/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-31/8cefed5f/pdp-960.avif",
          "webp": "/products/traditional-footwear-31/8cefed5f/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-31/8cefed5f/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-31/8cefed5f/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-31/8cefed5f/zoom-1600.avif",
          "webp": "/products/traditional-footwear-31/8cefed5f/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "210.00",
      "currency": "USD",
      "display_amount": "$210.00",
      "amount_in_cents": 21000,
      "compare_at_amount": "241.50",
      "compare_at_amount_in_cents": 24150,
      "display_compare_at_amount": "$241.50"
    },
    "original_price": {
      "amount": "210.00",
      "currency": "USD",
      "display_amount": "$210.00",
      "amount_in_cents": 21000
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_31_8",
    "default_variant": {
      "id": "var_traditional_footwear_31_8",
      "product_id": "prod_mirza_traditional_footwear_31",
      "is_master": true,
      "sku": "MIRZA-TRD-031-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "210.00",
        "currency": "USD",
        "display_amount": "$210.00",
        "amount_in_cents": 21000,
        "compare_at_amount_in_cents": 24150,
        "display_compare_at_amount": "$241.50"
      },
      "original_price": {
        "amount": "210.00",
        "currency": "USD",
        "display_amount": "$210.00",
        "amount_in_cents": 21000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_31_7",
        "product_id": "prod_mirza_traditional_footwear_31",
        "is_master": false,
        "sku": "MIRZA-TRD-031-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "210.00",
          "currency": "USD",
          "display_amount": "$210.00",
          "amount_in_cents": 21000,
          "compare_at_amount_in_cents": 24150,
          "display_compare_at_amount": "$241.50"
        },
        "original_price": {
          "amount": "210.00",
          "currency": "USD",
          "display_amount": "$210.00",
          "amount_in_cents": 21000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_31_8",
        "product_id": "prod_mirza_traditional_footwear_31",
        "is_master": true,
        "sku": "MIRZA-TRD-031-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "210.00",
          "currency": "USD",
          "display_amount": "$210.00",
          "amount_in_cents": 21000,
          "compare_at_amount_in_cents": 24150,
          "display_compare_at_amount": "$241.50"
        },
        "original_price": {
          "amount": "210.00",
          "currency": "USD",
          "display_amount": "$210.00",
          "amount_in_cents": 21000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_31_9",
        "product_id": "prod_mirza_traditional_footwear_31",
        "is_master": false,
        "sku": "MIRZA-TRD-031-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "210.00",
          "currency": "USD",
          "display_amount": "$210.00",
          "amount_in_cents": 21000,
          "compare_at_amount_in_cents": 24150,
          "display_compare_at_amount": "$241.50"
        },
        "original_price": {
          "amount": "210.00",
          "currency": "USD",
          "display_amount": "$210.00",
          "amount_in_cents": 21000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_31_10",
        "product_id": "prod_mirza_traditional_footwear_31",
        "is_master": false,
        "sku": "MIRZA-TRD-031-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "210.00",
          "currency": "USD",
          "display_amount": "$210.00",
          "amount_in_cents": 21000,
          "compare_at_amount_in_cents": 24150,
          "display_compare_at_amount": "$241.50"
        },
        "original_price": {
          "amount": "210.00",
          "currency": "USD",
          "display_amount": "$210.00",
          "amount_in_cents": 21000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_32",
    "name": "The Patiala Resham Thread Jutti",
    "slug": "traditional-footwear-32",
    "sku": "MIRZA-TRD-032",
    "description": "Vibrant multicolor silk thread needlework on tanned cowhide with padded insole.",
    "description_html": "<p>Vibrant multicolor silk thread needlework on tanned cowhide with padded insole.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Patiala Resham Thread Jutti | Mirza Footwear",
    "meta_description": "Vibrant multicolor silk thread needlework on tanned cowhide with padded insole.",
    "meta_keywords": "The Patiala Resham Thread Jutti, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-32/3af4126a/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_32_1",
      "url": "/products/traditional-footwear-32/3af4126a/card-lg-640.webp",
      "alt": "The Patiala Resham Thread Jutti",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-32/3af4126a/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-32/3af4126a/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-32/3af4126a/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-32/3af4126a/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-32/3af4126a/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_32_7",
        "var_traditional_footwear_32_8",
        "var_traditional_footwear_32_9",
        "var_traditional_footwear_32_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_32_1",
        "url": "/products/traditional-footwear-32/3af4126a/card-lg-640.webp",
        "alt": "The Patiala Resham Thread Jutti",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-32/3af4126a/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-32/3af4126a/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-32/3af4126a/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-32/3af4126a/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-32/3af4126a/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_32_7",
          "var_traditional_footwear_32_8",
          "var_traditional_footwear_32_9",
          "var_traditional_footwear_32_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-32/3af4126a/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAADQAQCdASoQABAABUB8JZwAAnXp5m9nuAD+uC+Yd3mpTmg1m38487pPvnkyy/Y1qqT7mHMaRWnQ76Dl36kJGZcXaHHtWrcvIOvTcdTKVgYESMYyrgAAAA==",
      "dominantColor": "#181818",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-32/3af4126a/thumb-160.avif",
          "webp": "/products/traditional-footwear-32/3af4126a/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-32/3af4126a/card-sm-320.avif",
          "webp": "/products/traditional-footwear-32/3af4126a/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-32/3af4126a/card-480.avif",
          "webp": "/products/traditional-footwear-32/3af4126a/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-32/3af4126a/card-lg-640.avif",
          "webp": "/products/traditional-footwear-32/3af4126a/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-32/3af4126a/pdp-960.avif",
          "webp": "/products/traditional-footwear-32/3af4126a/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-32/3af4126a/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-32/3af4126a/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-32/3af4126a/zoom-1600.avif",
          "webp": "/products/traditional-footwear-32/3af4126a/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "195.00",
      "currency": "USD",
      "display_amount": "$195.00",
      "amount_in_cents": 19500,
      "compare_at_amount": "224.25",
      "compare_at_amount_in_cents": 22425,
      "display_compare_at_amount": "$224.25"
    },
    "original_price": {
      "amount": "195.00",
      "currency": "USD",
      "display_amount": "$195.00",
      "amount_in_cents": 19500
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_32_8",
    "default_variant": {
      "id": "var_traditional_footwear_32_8",
      "product_id": "prod_mirza_traditional_footwear_32",
      "is_master": true,
      "sku": "MIRZA-TRD-032-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "195.00",
        "currency": "USD",
        "display_amount": "$195.00",
        "amount_in_cents": 19500,
        "compare_at_amount_in_cents": 22425,
        "display_compare_at_amount": "$224.25"
      },
      "original_price": {
        "amount": "195.00",
        "currency": "USD",
        "display_amount": "$195.00",
        "amount_in_cents": 19500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_32_7",
        "product_id": "prod_mirza_traditional_footwear_32",
        "is_master": false,
        "sku": "MIRZA-TRD-032-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "195.00",
          "currency": "USD",
          "display_amount": "$195.00",
          "amount_in_cents": 19500,
          "compare_at_amount_in_cents": 22425,
          "display_compare_at_amount": "$224.25"
        },
        "original_price": {
          "amount": "195.00",
          "currency": "USD",
          "display_amount": "$195.00",
          "amount_in_cents": 19500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_32_8",
        "product_id": "prod_mirza_traditional_footwear_32",
        "is_master": true,
        "sku": "MIRZA-TRD-032-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "195.00",
          "currency": "USD",
          "display_amount": "$195.00",
          "amount_in_cents": 19500,
          "compare_at_amount_in_cents": 22425,
          "display_compare_at_amount": "$224.25"
        },
        "original_price": {
          "amount": "195.00",
          "currency": "USD",
          "display_amount": "$195.00",
          "amount_in_cents": 19500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_32_9",
        "product_id": "prod_mirza_traditional_footwear_32",
        "is_master": false,
        "sku": "MIRZA-TRD-032-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "195.00",
          "currency": "USD",
          "display_amount": "$195.00",
          "amount_in_cents": 19500,
          "compare_at_amount_in_cents": 22425,
          "display_compare_at_amount": "$224.25"
        },
        "original_price": {
          "amount": "195.00",
          "currency": "USD",
          "display_amount": "$195.00",
          "amount_in_cents": 19500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_32_10",
        "product_id": "prod_mirza_traditional_footwear_32",
        "is_master": false,
        "sku": "MIRZA-TRD-032-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "195.00",
          "currency": "USD",
          "display_amount": "$195.00",
          "amount_in_cents": 19500,
          "compare_at_amount_in_cents": 22425,
          "display_compare_at_amount": "$224.25"
        },
        "original_price": {
          "amount": "195.00",
          "currency": "USD",
          "display_amount": "$195.00",
          "amount_in_cents": 19500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_33",
    "name": "The Awadh Embroidered Khussa",
    "slug": "traditional-footwear-33",
    "sku": "MIRZA-TRD-033",
    "description": "Aristocratic curved khussa with dense silver tilla stitching inspired by Awadhi royal courts.",
    "description_html": "<p>Aristocratic curved khussa with dense silver tilla stitching inspired by Awadhi royal courts.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Awadh Embroidered Khussa | Mirza Footwear",
    "meta_description": "Aristocratic curved khussa with dense silver tilla stitching inspired by Awadhi royal courts.",
    "meta_keywords": "The Awadh Embroidered Khussa, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-33/caff168b/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_33_1",
      "url": "/products/traditional-footwear-33/caff168b/card-lg-640.webp",
      "alt": "The Awadh Embroidered Khussa",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-33/caff168b/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-33/caff168b/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-33/caff168b/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-33/caff168b/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-33/caff168b/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_33_7",
        "var_traditional_footwear_33_8",
        "var_traditional_footwear_33_9",
        "var_traditional_footwear_33_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_33_1",
        "url": "/products/traditional-footwear-33/caff168b/card-lg-640.webp",
        "alt": "The Awadh Embroidered Khussa",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-33/caff168b/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-33/caff168b/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-33/caff168b/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-33/caff168b/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-33/caff168b/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_33_7",
          "var_traditional_footwear_33_8",
          "var_traditional_footwear_33_9",
          "var_traditional_footwear_33_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-33/caff168b/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAACwAQCdASoQABAABUB8JQAAU6X2GZGgAP7YTFQ76sHHcNXEaWpCs4iFc0Te1mfNPKcjfZixllgwgs3zhXokkWAtm/gx2rOe2oo7euxwV3tlHeAA",
      "dominantColor": "#a8a8a8",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-33/caff168b/thumb-160.avif",
          "webp": "/products/traditional-footwear-33/caff168b/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-33/caff168b/card-sm-320.avif",
          "webp": "/products/traditional-footwear-33/caff168b/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-33/caff168b/card-480.avif",
          "webp": "/products/traditional-footwear-33/caff168b/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-33/caff168b/card-lg-640.avif",
          "webp": "/products/traditional-footwear-33/caff168b/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-33/caff168b/pdp-960.avif",
          "webp": "/products/traditional-footwear-33/caff168b/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-33/caff168b/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-33/caff168b/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-33/caff168b/zoom-1600.avif",
          "webp": "/products/traditional-footwear-33/caff168b/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "235.00",
      "currency": "USD",
      "display_amount": "$235.00",
      "amount_in_cents": 23500,
      "compare_at_amount": "270.25",
      "compare_at_amount_in_cents": 27025,
      "display_compare_at_amount": "$270.25"
    },
    "original_price": {
      "amount": "235.00",
      "currency": "USD",
      "display_amount": "$235.00",
      "amount_in_cents": 23500
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_33_8",
    "default_variant": {
      "id": "var_traditional_footwear_33_8",
      "product_id": "prod_mirza_traditional_footwear_33",
      "is_master": true,
      "sku": "MIRZA-TRD-033-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "235.00",
        "currency": "USD",
        "display_amount": "$235.00",
        "amount_in_cents": 23500,
        "compare_at_amount_in_cents": 27025,
        "display_compare_at_amount": "$270.25"
      },
      "original_price": {
        "amount": "235.00",
        "currency": "USD",
        "display_amount": "$235.00",
        "amount_in_cents": 23500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_33_7",
        "product_id": "prod_mirza_traditional_footwear_33",
        "is_master": false,
        "sku": "MIRZA-TRD-033-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "235.00",
          "currency": "USD",
          "display_amount": "$235.00",
          "amount_in_cents": 23500,
          "compare_at_amount_in_cents": 27025,
          "display_compare_at_amount": "$270.25"
        },
        "original_price": {
          "amount": "235.00",
          "currency": "USD",
          "display_amount": "$235.00",
          "amount_in_cents": 23500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_33_8",
        "product_id": "prod_mirza_traditional_footwear_33",
        "is_master": true,
        "sku": "MIRZA-TRD-033-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "235.00",
          "currency": "USD",
          "display_amount": "$235.00",
          "amount_in_cents": 23500,
          "compare_at_amount_in_cents": 27025,
          "display_compare_at_amount": "$270.25"
        },
        "original_price": {
          "amount": "235.00",
          "currency": "USD",
          "display_amount": "$235.00",
          "amount_in_cents": 23500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_33_9",
        "product_id": "prod_mirza_traditional_footwear_33",
        "is_master": false,
        "sku": "MIRZA-TRD-033-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "235.00",
          "currency": "USD",
          "display_amount": "$235.00",
          "amount_in_cents": 23500,
          "compare_at_amount_in_cents": 27025,
          "display_compare_at_amount": "$270.25"
        },
        "original_price": {
          "amount": "235.00",
          "currency": "USD",
          "display_amount": "$235.00",
          "amount_in_cents": 23500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_33_10",
        "product_id": "prod_mirza_traditional_footwear_33",
        "is_master": false,
        "sku": "MIRZA-TRD-033-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "235.00",
          "currency": "USD",
          "display_amount": "$235.00",
          "amount_in_cents": 23500,
          "compare_at_amount_in_cents": 27025,
          "display_compare_at_amount": "$270.25"
        },
        "original_price": {
          "amount": "235.00",
          "currency": "USD",
          "display_amount": "$235.00",
          "amount_in_cents": 23500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_34",
    "name": "The Banarasi Brocade Mojari",
    "slug": "traditional-footwear-34",
    "sku": "MIRZA-TRD-034",
    "description": "Woven golden zari on royal purple silk fabric, lined with natural goat leather.",
    "description_html": "<p>Woven golden zari on royal purple silk fabric, lined with natural goat leather.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Banarasi Brocade Mojari | Mirza Footwear",
    "meta_description": "Woven golden zari on royal purple silk fabric, lined with natural goat leather.",
    "meta_keywords": "The Banarasi Brocade Mojari, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-34/e26d429b/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_34_1",
      "url": "/products/traditional-footwear-34/e26d429b/card-lg-640.webp",
      "alt": "The Banarasi Brocade Mojari",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-34/e26d429b/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-34/e26d429b/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-34/e26d429b/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-34/e26d429b/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-34/e26d429b/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_34_7",
        "var_traditional_footwear_34_8",
        "var_traditional_footwear_34_9",
        "var_traditional_footwear_34_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_34_1",
        "url": "/products/traditional-footwear-34/e26d429b/card-lg-640.webp",
        "alt": "The Banarasi Brocade Mojari",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-34/e26d429b/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-34/e26d429b/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-34/e26d429b/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-34/e26d429b/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-34/e26d429b/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_34_7",
          "var_traditional_footwear_34_8",
          "var_traditional_footwear_34_9",
          "var_traditional_footwear_34_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-34/e26d429b/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAADwAQCdASoQABAABUB8JYwAAqH06MN14kwA/pwPjkW0lFCqDsohRRM7BAmiD/UL4OBaAhrJ4uVx5wUKjtdbz2Ffoek7K74v5ekEKc60AOAAAA==",
      "dominantColor": "#887878",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-34/e26d429b/thumb-160.avif",
          "webp": "/products/traditional-footwear-34/e26d429b/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-34/e26d429b/card-sm-320.avif",
          "webp": "/products/traditional-footwear-34/e26d429b/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-34/e26d429b/card-480.avif",
          "webp": "/products/traditional-footwear-34/e26d429b/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-34/e26d429b/card-lg-640.avif",
          "webp": "/products/traditional-footwear-34/e26d429b/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-34/e26d429b/pdp-960.avif",
          "webp": "/products/traditional-footwear-34/e26d429b/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-34/e26d429b/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-34/e26d429b/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-34/e26d429b/zoom-1600.avif",
          "webp": "/products/traditional-footwear-34/e26d429b/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "225.00",
      "currency": "USD",
      "display_amount": "$225.00",
      "amount_in_cents": 22500,
      "compare_at_amount": "258.75",
      "compare_at_amount_in_cents": 25875,
      "display_compare_at_amount": "$258.75"
    },
    "original_price": {
      "amount": "225.00",
      "currency": "USD",
      "display_amount": "$225.00",
      "amount_in_cents": 22500
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_34_8",
    "default_variant": {
      "id": "var_traditional_footwear_34_8",
      "product_id": "prod_mirza_traditional_footwear_34",
      "is_master": true,
      "sku": "MIRZA-TRD-034-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "225.00",
        "currency": "USD",
        "display_amount": "$225.00",
        "amount_in_cents": 22500,
        "compare_at_amount_in_cents": 25875,
        "display_compare_at_amount": "$258.75"
      },
      "original_price": {
        "amount": "225.00",
        "currency": "USD",
        "display_amount": "$225.00",
        "amount_in_cents": 22500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_34_7",
        "product_id": "prod_mirza_traditional_footwear_34",
        "is_master": false,
        "sku": "MIRZA-TRD-034-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "225.00",
          "currency": "USD",
          "display_amount": "$225.00",
          "amount_in_cents": 22500,
          "compare_at_amount_in_cents": 25875,
          "display_compare_at_amount": "$258.75"
        },
        "original_price": {
          "amount": "225.00",
          "currency": "USD",
          "display_amount": "$225.00",
          "amount_in_cents": 22500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_34_8",
        "product_id": "prod_mirza_traditional_footwear_34",
        "is_master": true,
        "sku": "MIRZA-TRD-034-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "225.00",
          "currency": "USD",
          "display_amount": "$225.00",
          "amount_in_cents": 22500,
          "compare_at_amount_in_cents": 25875,
          "display_compare_at_amount": "$258.75"
        },
        "original_price": {
          "amount": "225.00",
          "currency": "USD",
          "display_amount": "$225.00",
          "amount_in_cents": 22500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_34_9",
        "product_id": "prod_mirza_traditional_footwear_34",
        "is_master": false,
        "sku": "MIRZA-TRD-034-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "225.00",
          "currency": "USD",
          "display_amount": "$225.00",
          "amount_in_cents": 22500,
          "compare_at_amount_in_cents": 25875,
          "display_compare_at_amount": "$258.75"
        },
        "original_price": {
          "amount": "225.00",
          "currency": "USD",
          "display_amount": "$225.00",
          "amount_in_cents": 22500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_34_10",
        "product_id": "prod_mirza_traditional_footwear_34",
        "is_master": false,
        "sku": "MIRZA-TRD-034-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "225.00",
          "currency": "USD",
          "display_amount": "$225.00",
          "amount_in_cents": 22500,
          "compare_at_amount_in_cents": 25875,
          "display_compare_at_amount": "$258.75"
        },
        "original_price": {
          "amount": "225.00",
          "currency": "USD",
          "display_amount": "$225.00",
          "amount_in_cents": 22500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_35",
    "name": "The Jaipur Block-Print Jutti",
    "slug": "traditional-footwear-35",
    "sku": "MIRZA-TRD-035",
    "description": "Cotton canvas upper featuring traditional Sanganeri block prints with leather sole.",
    "description_html": "<p>Cotton canvas upper featuring traditional Sanganeri block prints with leather sole.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Jaipur Block-Print Jutti | Mirza Footwear",
    "meta_description": "Cotton canvas upper featuring traditional Sanganeri block prints with leather sole.",
    "meta_keywords": "The Jaipur Block-Print Jutti, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-35/74cc459c/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_35_1",
      "url": "/products/traditional-footwear-35/74cc459c/card-lg-640.webp",
      "alt": "The Jaipur Block-Print Jutti",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-35/74cc459c/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-35/74cc459c/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-35/74cc459c/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-35/74cc459c/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-35/74cc459c/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_35_7",
        "var_traditional_footwear_35_8",
        "var_traditional_footwear_35_9",
        "var_traditional_footwear_35_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_35_1",
        "url": "/products/traditional-footwear-35/74cc459c/card-lg-640.webp",
        "alt": "The Jaipur Block-Print Jutti",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-35/74cc459c/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-35/74cc459c/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-35/74cc459c/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-35/74cc459c/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-35/74cc459c/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_35_7",
          "var_traditional_footwear_35_8",
          "var_traditional_footwear_35_9",
          "var_traditional_footwear_35_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-35/74cc459c/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmoAAABXRUJQVlA4IF4AAADQAQCdASoQABAABUB8JZwAAhWrf+eHxAD+2B0m5fQZDwcWd9E91U5vkI07Ul6u0iapFvSv7j11Rkkg7L37ks9fVkoRdrMEmwHgKmdy9Pa5ZLe0QEeiqmfWbd4zrQgA",
      "dominantColor": "#b8b8b8",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-35/74cc459c/thumb-160.avif",
          "webp": "/products/traditional-footwear-35/74cc459c/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-35/74cc459c/card-sm-320.avif",
          "webp": "/products/traditional-footwear-35/74cc459c/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-35/74cc459c/card-480.avif",
          "webp": "/products/traditional-footwear-35/74cc459c/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-35/74cc459c/card-lg-640.avif",
          "webp": "/products/traditional-footwear-35/74cc459c/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-35/74cc459c/pdp-960.avif",
          "webp": "/products/traditional-footwear-35/74cc459c/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-35/74cc459c/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-35/74cc459c/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-35/74cc459c/zoom-1600.avif",
          "webp": "/products/traditional-footwear-35/74cc459c/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "190.00",
      "currency": "USD",
      "display_amount": "$190.00",
      "amount_in_cents": 19000,
      "compare_at_amount": "218.50",
      "compare_at_amount_in_cents": 21850,
      "display_compare_at_amount": "$218.50"
    },
    "original_price": {
      "amount": "190.00",
      "currency": "USD",
      "display_amount": "$190.00",
      "amount_in_cents": 19000
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_35_8",
    "default_variant": {
      "id": "var_traditional_footwear_35_8",
      "product_id": "prod_mirza_traditional_footwear_35",
      "is_master": true,
      "sku": "MIRZA-TRD-035-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "190.00",
        "currency": "USD",
        "display_amount": "$190.00",
        "amount_in_cents": 19000,
        "compare_at_amount_in_cents": 21850,
        "display_compare_at_amount": "$218.50"
      },
      "original_price": {
        "amount": "190.00",
        "currency": "USD",
        "display_amount": "$190.00",
        "amount_in_cents": 19000
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_35_7",
        "product_id": "prod_mirza_traditional_footwear_35",
        "is_master": false,
        "sku": "MIRZA-TRD-035-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "190.00",
          "currency": "USD",
          "display_amount": "$190.00",
          "amount_in_cents": 19000,
          "compare_at_amount_in_cents": 21850,
          "display_compare_at_amount": "$218.50"
        },
        "original_price": {
          "amount": "190.00",
          "currency": "USD",
          "display_amount": "$190.00",
          "amount_in_cents": 19000
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_35_8",
        "product_id": "prod_mirza_traditional_footwear_35",
        "is_master": true,
        "sku": "MIRZA-TRD-035-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "190.00",
          "currency": "USD",
          "display_amount": "$190.00",
          "amount_in_cents": 19000,
          "compare_at_amount_in_cents": 21850,
          "display_compare_at_amount": "$218.50"
        },
        "original_price": {
          "amount": "190.00",
          "currency": "USD",
          "display_amount": "$190.00",
          "amount_in_cents": 19000
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_35_9",
        "product_id": "prod_mirza_traditional_footwear_35",
        "is_master": false,
        "sku": "MIRZA-TRD-035-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "190.00",
          "currency": "USD",
          "display_amount": "$190.00",
          "amount_in_cents": 19000,
          "compare_at_amount_in_cents": 21850,
          "display_compare_at_amount": "$218.50"
        },
        "original_price": {
          "amount": "190.00",
          "currency": "USD",
          "display_amount": "$190.00",
          "amount_in_cents": 19000
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_35_10",
        "product_id": "prod_mirza_traditional_footwear_35",
        "is_master": false,
        "sku": "MIRZA-TRD-035-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "190.00",
          "currency": "USD",
          "display_amount": "$190.00",
          "amount_in_cents": 19000,
          "compare_at_amount_in_cents": 21850,
          "display_compare_at_amount": "$218.50"
        },
        "original_price": {
          "amount": "190.00",
          "currency": "USD",
          "display_amount": "$190.00",
          "amount_in_cents": 19000
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_36",
    "name": "The Vintage Chamba Sandal",
    "slug": "traditional-footwear-36",
    "sku": "MIRZA-TRD-036",
    "description": "Embroidered leather strappy sandal originating from Himachal heritage traditions.",
    "description_html": "<p>Embroidered leather strappy sandal originating from Himachal heritage traditions.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Vintage Chamba Sandal | Mirza Footwear",
    "meta_description": "Embroidered leather strappy sandal originating from Himachal heritage traditions.",
    "meta_keywords": "The Vintage Chamba Sandal, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-36/54cc9cc4/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_36_1",
      "url": "/products/traditional-footwear-36/54cc9cc4/card-lg-640.webp",
      "alt": "The Vintage Chamba Sandal",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-36/54cc9cc4/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-36/54cc9cc4/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-36/54cc9cc4/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-36/54cc9cc4/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-36/54cc9cc4/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_36_7",
        "var_traditional_footwear_36_8",
        "var_traditional_footwear_36_9",
        "var_traditional_footwear_36_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_36_1",
        "url": "/products/traditional-footwear-36/54cc9cc4/card-lg-640.webp",
        "alt": "The Vintage Chamba Sandal",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-36/54cc9cc4/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-36/54cc9cc4/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-36/54cc9cc4/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-36/54cc9cc4/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-36/54cc9cc4/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_36_7",
          "var_traditional_footwear_36_8",
          "var_traditional_footwear_36_9",
          "var_traditional_footwear_36_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-36/54cc9cc4/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRlAAAABXRUJQVlA4IEQAAADQAQCdASoQABAABUB8JZQAAxbd9dW1IAD+uDCXh90UKKr0JuJrLtwba8e4rw5sGjh4FDRJ+/WyGwNlW0g48hDUcShAAA==",
      "dominantColor": "#b8b8b8",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-36/54cc9cc4/thumb-160.avif",
          "webp": "/products/traditional-footwear-36/54cc9cc4/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-36/54cc9cc4/card-sm-320.avif",
          "webp": "/products/traditional-footwear-36/54cc9cc4/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-36/54cc9cc4/card-480.avif",
          "webp": "/products/traditional-footwear-36/54cc9cc4/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-36/54cc9cc4/card-lg-640.avif",
          "webp": "/products/traditional-footwear-36/54cc9cc4/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-36/54cc9cc4/pdp-960.avif",
          "webp": "/products/traditional-footwear-36/54cc9cc4/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-36/54cc9cc4/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-36/54cc9cc4/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-36/54cc9cc4/zoom-1600.avif",
          "webp": "/products/traditional-footwear-36/54cc9cc4/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "185.00",
      "currency": "USD",
      "display_amount": "$185.00",
      "amount_in_cents": 18500,
      "compare_at_amount": "212.75",
      "compare_at_amount_in_cents": 21275,
      "display_compare_at_amount": "$212.75"
    },
    "original_price": {
      "amount": "185.00",
      "currency": "USD",
      "display_amount": "$185.00",
      "amount_in_cents": 18500
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_36_8",
    "default_variant": {
      "id": "var_traditional_footwear_36_8",
      "product_id": "prod_mirza_traditional_footwear_36",
      "is_master": true,
      "sku": "MIRZA-TRD-036-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "185.00",
        "currency": "USD",
        "display_amount": "$185.00",
        "amount_in_cents": 18500,
        "compare_at_amount_in_cents": 21275,
        "display_compare_at_amount": "$212.75"
      },
      "original_price": {
        "amount": "185.00",
        "currency": "USD",
        "display_amount": "$185.00",
        "amount_in_cents": 18500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_36_7",
        "product_id": "prod_mirza_traditional_footwear_36",
        "is_master": false,
        "sku": "MIRZA-TRD-036-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "185.00",
          "currency": "USD",
          "display_amount": "$185.00",
          "amount_in_cents": 18500,
          "compare_at_amount_in_cents": 21275,
          "display_compare_at_amount": "$212.75"
        },
        "original_price": {
          "amount": "185.00",
          "currency": "USD",
          "display_amount": "$185.00",
          "amount_in_cents": 18500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_36_8",
        "product_id": "prod_mirza_traditional_footwear_36",
        "is_master": true,
        "sku": "MIRZA-TRD-036-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "185.00",
          "currency": "USD",
          "display_amount": "$185.00",
          "amount_in_cents": 18500,
          "compare_at_amount_in_cents": 21275,
          "display_compare_at_amount": "$212.75"
        },
        "original_price": {
          "amount": "185.00",
          "currency": "USD",
          "display_amount": "$185.00",
          "amount_in_cents": 18500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_36_9",
        "product_id": "prod_mirza_traditional_footwear_36",
        "is_master": false,
        "sku": "MIRZA-TRD-036-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "185.00",
          "currency": "USD",
          "display_amount": "$185.00",
          "amount_in_cents": 18500,
          "compare_at_amount_in_cents": 21275,
          "display_compare_at_amount": "$212.75"
        },
        "original_price": {
          "amount": "185.00",
          "currency": "USD",
          "display_amount": "$185.00",
          "amount_in_cents": 18500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_36_10",
        "product_id": "prod_mirza_traditional_footwear_36",
        "is_master": false,
        "sku": "MIRZA-TRD-036-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "185.00",
          "currency": "USD",
          "display_amount": "$185.00",
          "amount_in_cents": 18500,
          "compare_at_amount_in_cents": 21275,
          "display_compare_at_amount": "$212.75"
        },
        "original_price": {
          "amount": "185.00",
          "currency": "USD",
          "display_amount": "$185.00",
          "amount_in_cents": 18500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_37",
    "name": "The Shahzadi Pearl-Work Jutti",
    "slug": "traditional-footwear-37",
    "sku": "MIRZA-TRD-037",
    "description": "Exquisite bridal footwear encrusted with faux river pearls and intricate metallic lace.",
    "description_html": "<p>Exquisite bridal footwear encrusted with faux river pearls and intricate metallic lace.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Shahzadi Pearl-Work Jutti | Mirza Footwear",
    "meta_description": "Exquisite bridal footwear encrusted with faux river pearls and intricate metallic lace.",
    "meta_keywords": "The Shahzadi Pearl-Work Jutti, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-37/ca383748/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_37_1",
      "url": "/products/traditional-footwear-37/ca383748/card-lg-640.webp",
      "alt": "The Shahzadi Pearl-Work Jutti",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-37/ca383748/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-37/ca383748/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-37/ca383748/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-37/ca383748/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-37/ca383748/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_37_7",
        "var_traditional_footwear_37_8",
        "var_traditional_footwear_37_9",
        "var_traditional_footwear_37_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_37_1",
        "url": "/products/traditional-footwear-37/ca383748/card-lg-640.webp",
        "alt": "The Shahzadi Pearl-Work Jutti",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-37/ca383748/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-37/ca383748/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-37/ca383748/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-37/ca383748/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-37/ca383748/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_37_7",
          "var_traditional_footwear_37_8",
          "var_traditional_footwear_37_9",
          "var_traditional_footwear_37_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-37/ca383748/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAABQAgCdASoQABAABUB8JZQAOcFuAXCc78XDowAA/sp87U+4rG6YhXtaQcRmR3BC+GoJXdzC7/GXJKV7Mdf3rPGwcd4+I0mmbhjc2PIoAAA=",
      "dominantColor": "#c8c8c8",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-37/ca383748/thumb-160.avif",
          "webp": "/products/traditional-footwear-37/ca383748/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-37/ca383748/card-sm-320.avif",
          "webp": "/products/traditional-footwear-37/ca383748/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-37/ca383748/card-480.avif",
          "webp": "/products/traditional-footwear-37/ca383748/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-37/ca383748/card-lg-640.avif",
          "webp": "/products/traditional-footwear-37/ca383748/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-37/ca383748/pdp-960.avif",
          "webp": "/products/traditional-footwear-37/ca383748/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-37/ca383748/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-37/ca383748/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-37/ca383748/zoom-1600.avif",
          "webp": "/products/traditional-footwear-37/ca383748/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "265.00",
      "currency": "USD",
      "display_amount": "$265.00",
      "amount_in_cents": 26500,
      "compare_at_amount": "304.75",
      "compare_at_amount_in_cents": 30475,
      "display_compare_at_amount": "$304.75"
    },
    "original_price": {
      "amount": "265.00",
      "currency": "USD",
      "display_amount": "$265.00",
      "amount_in_cents": 26500
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_37_8",
    "default_variant": {
      "id": "var_traditional_footwear_37_8",
      "product_id": "prod_mirza_traditional_footwear_37",
      "is_master": true,
      "sku": "MIRZA-TRD-037-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "265.00",
        "currency": "USD",
        "display_amount": "$265.00",
        "amount_in_cents": 26500,
        "compare_at_amount_in_cents": 30475,
        "display_compare_at_amount": "$304.75"
      },
      "original_price": {
        "amount": "265.00",
        "currency": "USD",
        "display_amount": "$265.00",
        "amount_in_cents": 26500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_37_7",
        "product_id": "prod_mirza_traditional_footwear_37",
        "is_master": false,
        "sku": "MIRZA-TRD-037-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "265.00",
          "currency": "USD",
          "display_amount": "$265.00",
          "amount_in_cents": 26500,
          "compare_at_amount_in_cents": 30475,
          "display_compare_at_amount": "$304.75"
        },
        "original_price": {
          "amount": "265.00",
          "currency": "USD",
          "display_amount": "$265.00",
          "amount_in_cents": 26500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_37_8",
        "product_id": "prod_mirza_traditional_footwear_37",
        "is_master": true,
        "sku": "MIRZA-TRD-037-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "265.00",
          "currency": "USD",
          "display_amount": "$265.00",
          "amount_in_cents": 26500,
          "compare_at_amount_in_cents": 30475,
          "display_compare_at_amount": "$304.75"
        },
        "original_price": {
          "amount": "265.00",
          "currency": "USD",
          "display_amount": "$265.00",
          "amount_in_cents": 26500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_37_9",
        "product_id": "prod_mirza_traditional_footwear_37",
        "is_master": false,
        "sku": "MIRZA-TRD-037-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "265.00",
          "currency": "USD",
          "display_amount": "$265.00",
          "amount_in_cents": 26500,
          "compare_at_amount_in_cents": 30475,
          "display_compare_at_amount": "$304.75"
        },
        "original_price": {
          "amount": "265.00",
          "currency": "USD",
          "display_amount": "$265.00",
          "amount_in_cents": 26500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_37_10",
        "product_id": "prod_mirza_traditional_footwear_37",
        "is_master": false,
        "sku": "MIRZA-TRD-037-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "265.00",
          "currency": "USD",
          "display_amount": "$265.00",
          "amount_in_cents": 26500,
          "compare_at_amount_in_cents": 30475,
          "display_compare_at_amount": "$304.75"
        },
        "original_price": {
          "amount": "265.00",
          "currency": "USD",
          "display_amount": "$265.00",
          "amount_in_cents": 26500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  },
  {
    "id": "prod_mirza_traditional_footwear_38",
    "name": "The Royal Dastarkhan Slip-On",
    "slug": "traditional-footwear-38",
    "sku": "MIRZA-TRD-038",
    "description": "Casual luxury slip-on jutti designed for festive evenings with effortless comfort.",
    "description_html": "<p>Casual luxury slip-on jutti designed for festive evenings with effortless comfort.</p>",
    "purchasable": true,
    "in_stock": true,
    "meta_title": "The Royal Dastarkhan Slip-On | Mirza Footwear",
    "meta_description": "Casual luxury slip-on jutti designed for festive evenings with effortless comfort.",
    "meta_keywords": "The Royal Dastarkhan Slip-On, handcrafted footwear, luxury leather",
    "thumbnail_url": "/products/traditional-footwear-38/2d8e97e4/card-sm-320.webp",
    "primary_media": {
      "id": "med_traditional_footwear_38_1",
      "url": "/products/traditional-footwear-38/2d8e97e4/card-lg-640.webp",
      "alt": "The Royal Dastarkhan Slip-On",
      "position": 1,
      "media_type": "image",
      "original_url": "/products/traditional-footwear-38/2d8e97e4/zoom-1600.webp",
      "large_url": "/products/traditional-footwear-38/2d8e97e4/card-lg-640.webp",
      "xlarge_url": "/products/traditional-footwear-38/2d8e97e4/zoom-1600.webp",
      "small_url": "/products/traditional-footwear-38/2d8e97e4/card-sm-320.webp",
      "mini_url": "/products/traditional-footwear-38/2d8e97e4/card-sm-320.webp",
      "variant_ids": [
        "var_traditional_footwear_38_7",
        "var_traditional_footwear_38_8",
        "var_traditional_footwear_38_9",
        "var_traditional_footwear_38_10"
      ]
    },
    "media": [
      {
        "id": "med_traditional_footwear_38_1",
        "url": "/products/traditional-footwear-38/2d8e97e4/card-lg-640.webp",
        "alt": "The Royal Dastarkhan Slip-On",
        "position": 1,
        "media_type": "image",
        "original_url": "/products/traditional-footwear-38/2d8e97e4/zoom-1600.webp",
        "large_url": "/products/traditional-footwear-38/2d8e97e4/card-lg-640.webp",
        "xlarge_url": "/products/traditional-footwear-38/2d8e97e4/zoom-1600.webp",
        "small_url": "/products/traditional-footwear-38/2d8e97e4/card-sm-320.webp",
        "mini_url": "/products/traditional-footwear-38/2d8e97e4/card-sm-320.webp",
        "variant_ids": [
          "var_traditional_footwear_38_7",
          "var_traditional_footwear_38_8",
          "var_traditional_footwear_38_9",
          "var_traditional_footwear_38_10"
        ]
      }
    ],
    "product_media": {
      "mainUrl": "/products/traditional-footwear-38/2d8e97e4/card-lg-640.webp",
      "lqip": "data:image/webp;base64,UklGRmoAAABXRUJQVlA4IF4AAADQAQCdASoQABAABUB8JZQAAhbGfL8vAADif8QR/ZUaBv2Abtrx7SBhUUXafQw5WbKOE2zEEcP8hq2RsoesJtkIWOUAwHAKWvy5Y3qef4VbO91+X63mTW+H9PIDSgAA",
      "dominantColor": "#181818",
      "variants": {
        "160": {
          "avif": "/products/traditional-footwear-38/2d8e97e4/thumb-160.avif",
          "webp": "/products/traditional-footwear-38/2d8e97e4/thumb-160.webp"
        },
        "320": {
          "avif": "/products/traditional-footwear-38/2d8e97e4/card-sm-320.avif",
          "webp": "/products/traditional-footwear-38/2d8e97e4/card-sm-320.webp"
        },
        "480": {
          "avif": "/products/traditional-footwear-38/2d8e97e4/card-480.avif",
          "webp": "/products/traditional-footwear-38/2d8e97e4/card-480.webp"
        },
        "640": {
          "avif": "/products/traditional-footwear-38/2d8e97e4/card-lg-640.avif",
          "webp": "/products/traditional-footwear-38/2d8e97e4/card-lg-640.webp"
        },
        "960": {
          "avif": "/products/traditional-footwear-38/2d8e97e4/pdp-960.avif",
          "webp": "/products/traditional-footwear-38/2d8e97e4/pdp-960.webp"
        },
        "1280": {
          "avif": "/products/traditional-footwear-38/2d8e97e4/pdp-lg-1280.avif",
          "webp": "/products/traditional-footwear-38/2d8e97e4/pdp-lg-1280.webp"
        },
        "1600": {
          "avif": "/products/traditional-footwear-38/2d8e97e4/zoom-1600.avif",
          "webp": "/products/traditional-footwear-38/2d8e97e4/zoom-1600.webp"
        }
      }
    },
    "price": {
      "amount": "215.00",
      "currency": "USD",
      "display_amount": "$215.00",
      "amount_in_cents": 21500,
      "compare_at_amount": "247.25",
      "compare_at_amount_in_cents": 24725,
      "display_compare_at_amount": "$247.25"
    },
    "original_price": {
      "amount": "215.00",
      "currency": "USD",
      "display_amount": "$215.00",
      "amount_in_cents": 21500
    },
    "categories": [
      {
        "id": "8",
        "name": "Traditional",
        "permalink": "categories/traditional",
        "description": "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
        "parent_id": null,
        "children": [],
        "ancestors": []
      }
    ],
    "default_variant_id": "var_traditional_footwear_38_8",
    "default_variant": {
      "id": "var_traditional_footwear_38_8",
      "product_id": "prod_mirza_traditional_footwear_38",
      "is_master": true,
      "sku": "MIRZA-TRD-038-8",
      "in_stock": true,
      "purchasable": true,
      "track_inventory": true,
      "price": {
        "amount": "215.00",
        "currency": "USD",
        "display_amount": "$215.00",
        "amount_in_cents": 21500,
        "compare_at_amount_in_cents": 24725,
        "display_compare_at_amount": "$247.25"
      },
      "original_price": {
        "amount": "215.00",
        "currency": "USD",
        "display_amount": "$215.00",
        "amount_in_cents": 21500
      },
      "options_text": "Size: UK/India 8",
      "option_values": [
        {
          "id": "opt_sz_8",
          "option_type_id": "ot_size",
          "name": "8",
          "label": "UK/India 8",
          "presentation": "UK/India 8",
          "position": 2,
          "color_code": null,
          "option_type_name": "size",
          "option_type_label": "Size",
          "image_url": null
        }
      ]
    },
    "variants": [
      {
        "id": "var_traditional_footwear_38_7",
        "product_id": "prod_mirza_traditional_footwear_38",
        "is_master": false,
        "sku": "MIRZA-TRD-038-7",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "215.00",
          "currency": "USD",
          "display_amount": "$215.00",
          "amount_in_cents": 21500,
          "compare_at_amount_in_cents": 24725,
          "display_compare_at_amount": "$247.25"
        },
        "original_price": {
          "amount": "215.00",
          "currency": "USD",
          "display_amount": "$215.00",
          "amount_in_cents": 21500
        },
        "options_text": "Size: UK/India 7",
        "option_values": [
          {
            "id": "opt_sz_7",
            "option_type_id": "ot_size",
            "name": "7",
            "label": "UK/India 7",
            "presentation": "UK/India 7",
            "position": 1,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_38_8",
        "product_id": "prod_mirza_traditional_footwear_38",
        "is_master": true,
        "sku": "MIRZA-TRD-038-8",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "215.00",
          "currency": "USD",
          "display_amount": "$215.00",
          "amount_in_cents": 21500,
          "compare_at_amount_in_cents": 24725,
          "display_compare_at_amount": "$247.25"
        },
        "original_price": {
          "amount": "215.00",
          "currency": "USD",
          "display_amount": "$215.00",
          "amount_in_cents": 21500
        },
        "options_text": "Size: UK/India 8",
        "option_values": [
          {
            "id": "opt_sz_8",
            "option_type_id": "ot_size",
            "name": "8",
            "label": "UK/India 8",
            "presentation": "UK/India 8",
            "position": 2,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_38_9",
        "product_id": "prod_mirza_traditional_footwear_38",
        "is_master": false,
        "sku": "MIRZA-TRD-038-9",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "215.00",
          "currency": "USD",
          "display_amount": "$215.00",
          "amount_in_cents": 21500,
          "compare_at_amount_in_cents": 24725,
          "display_compare_at_amount": "$247.25"
        },
        "original_price": {
          "amount": "215.00",
          "currency": "USD",
          "display_amount": "$215.00",
          "amount_in_cents": 21500
        },
        "options_text": "Size: UK/India 9",
        "option_values": [
          {
            "id": "opt_sz_9",
            "option_type_id": "ot_size",
            "name": "9",
            "label": "UK/India 9",
            "presentation": "UK/India 9",
            "position": 3,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      },
      {
        "id": "var_traditional_footwear_38_10",
        "product_id": "prod_mirza_traditional_footwear_38",
        "is_master": false,
        "sku": "MIRZA-TRD-038-10",
        "in_stock": true,
        "purchasable": true,
        "track_inventory": true,
        "price": {
          "amount": "215.00",
          "currency": "USD",
          "display_amount": "$215.00",
          "amount_in_cents": 21500,
          "compare_at_amount_in_cents": 24725,
          "display_compare_at_amount": "$247.25"
        },
        "original_price": {
          "amount": "215.00",
          "currency": "USD",
          "display_amount": "$215.00",
          "amount_in_cents": 21500
        },
        "options_text": "Size: UK/India 10",
        "option_values": [
          {
            "id": "opt_sz_10",
            "option_type_id": "ot_size",
            "name": "10",
            "label": "UK/India 10",
            "presentation": "UK/India 10",
            "position": 4,
            "color_code": null,
            "option_type_name": "size",
            "option_type_label": "Size",
            "image_url": null
          }
        ]
      }
    ],
    "option_types": [
      {
        "id": "ot_size",
        "name": "size",
        "label": "Size",
        "presentation": "Size",
        "position": 1,
        "kind": "button"
      }
    ]
  }
] as const;
