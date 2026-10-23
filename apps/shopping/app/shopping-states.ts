export type CartItem = {
  name: string;
  price: string;
  image: string;
  qty: number;
};

export type ShoppingScrollTarget = "top" | "bottom" | "todayDiscovery";

export type ShoppingBenchmarkState = {
  id: string;
  route: "home" | "product";
  productId?: string;
  scrollTarget: ShoppingScrollTarget;
  cartItems: CartItem[];
  home: {
    showPromoModal: boolean;
    activeHero: number;
    timeDealPage: number;
    myMenuOpen: boolean;
    cartOpen: boolean;
    catOpen: boolean;
    eventDelayMs: number | null;
    eventKind: "delivery" | "coupon" | "timedeal" | null;
  };
  product: {
    colorMenuOpen: boolean;
    interestPopupDelayMs: number | null;
    consultationWidgetOpen: boolean;
    consultationResolveDelayMs: number | null;
  };
};

export const DEFAULT_CART_ITEMS: CartItem[] = [
  {
    name: "Noise-Canceling Bluetooth Earphones",
    price: "₩89,000",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&h=80&fit=crop&q=80",
    qty: 1,
  },
  {
    name: "Stainless Steel Electric Kettle 1.7L",
    price: "₩21,900",
    image: "https://images.unsplash.com/photo-1517705008128-361805f42e86?w=80&h=80&fit=crop&q=80",
    qty: 2,
  },
  {
    name: "Capang Basics Daily T-Shirt 3-Pack",
    price: "₩18,900",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&h=80&fit=crop&q=80",
    qty: 1,
  },
  {
    name: "Organic Avocado Pack",
    price: "₩12,900",
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=80&h=80&fit=crop&q=80",
    qty: 2,
  },
  {
    name: "Ultra Soft Bath Towel Set",
    price: "₩24,900",
    image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=80&h=80&fit=crop&q=80",
    qty: 1,
  },
  {
    name: "Premium Cleaned Salmon 300g",
    price: "₩15,800",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=80&h=80&fit=crop&q=80",
    qty: 1,
  },
  {
    name: "Dual-Sided Memory Foam Pillow Set",
    price: "₩29,900",
    image: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=80&h=80&fit=crop&q=80",
    qty: 1,
  },
];

export function cloneCartItems(items: CartItem[]) {
  return items.map((item) => ({ ...item }));
}

function createBaseState(): ShoppingBenchmarkState {
  return {
    id: "default",
    route: "home",
    scrollTarget: "top",
    cartItems: cloneCartItems(DEFAULT_CART_ITEMS),
    home: {
      showPromoModal: false,
      activeHero: 0,
      timeDealPage: 0,
      myMenuOpen: false,
      cartOpen: false,
      catOpen: false,
      eventDelayMs: null,
      eventKind: null,
    },
    product: {
      colorMenuOpen: false,
      interestPopupDelayMs: null,
      consultationWidgetOpen: false,
      consultationResolveDelayMs: null,
    },
  };
}

export function getShoppingBenchmarkState(stateId?: string | null): ShoppingBenchmarkState {
  const base = createBaseState();

  switch (stateId) {
    case "1":
      return {
        ...base,
        id: "1",
      };
    case "2":
      return {
        ...base,
        id: "2",
        scrollTarget: "bottom",
      };
    case "3":
      return {
        ...base,
        id: "3",
        route: "product",
        productId: "earphones",
      };
    case "4":
      return {
        ...base,
        id: "4",
        route: "product",
        productId: "earphones",
        scrollTarget: "bottom",
      };
    case "5":
      return {
        ...base,
        id: "5",
        home: {
          ...base.home,
          timeDealPage: 2,
        },
      };
    case "6":
      return {
        ...base,
        id: "6",
        route: "product",
        productId: "earphones",
        product: {
          ...base.product,
          colorMenuOpen: true,
        },
      };
    case "7":
      return {
        ...base,
        id: "7",
        scrollTarget: "todayDiscovery",
        home: {
          ...base.home,
          catOpen: true,
        },
      };
    case "8":
      return {
        ...base,
        id: "8",
        home: {
          ...base.home,
          showPromoModal: true,
        },
      };
    case "9":
      return {
        ...base,
        id: "9",
        route: "product",
        productId: "earphones",
        product: {
          ...base.product,
          interestPopupDelayMs: 3000,
        },
      };
    case "10":
      return {
        ...base,
        id: "10",
        route: "product",
        productId: "earphones",
        product: {
          ...base.product,
          consultationWidgetOpen: true,
          consultationResolveDelayMs: 10000,
        },
      };
    case "11":
      return {
        ...base,
        id: "11",
        home: {
          ...base.home,
          eventDelayMs: 3200,
          eventKind: "delivery",
        },
      };
    case "12":
      return {
        ...base,
        id: "12",
        home: {
          ...base.home,
          eventDelayMs: 3400,
          eventKind: "coupon",
        },
      };
    case "13":
      return {
        ...base,
        id: "13",
        home: {
          ...base.home,
          eventDelayMs: 3600,
          eventKind: "timedeal",
        },
      };
    default:
      return base;
  }
}
