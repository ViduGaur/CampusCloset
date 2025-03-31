import {
  Shirt,
  Gem,
  Footprints,
  UserRound,
  Briefcase,
  MoreHorizontal,
  Clock,
  Check,
  X,
  Camera,
  Upload,
  Eye,
  MapPin,
  Search,
  Filter,
  Bell,
  SortDesc,
  User,
  BadgeCheck,
} from "lucide-react";

// This file exports all icons used in the app centrally
// so we can easily swap icon libraries if needed

export {
  // Clothing/Category icons
  Shirt,
  Gem,
  Footprints,
  UserRound,
  Briefcase,
  MoreHorizontal,
  
  // UI action icons
  Check,
  X,
  Camera,
  Upload,
  Eye,
  Clock,
  MapPin,
  Search,
  Filter,
  Bell,
  SortDesc,
  User,
  BadgeCheck as IdCard,
};

// Map category icons to Lucide React components
export const categoryIconMap: Record<string, React.ReactNode> = {
  "shirt": <Shirt />,
  "shoe-prints": <Footprints />,
  "gem": <Gem />,
  "user-tie": <UserRound />,
  "tshirt": <Shirt />,
  "vest": <Briefcase />,
  "more": <MoreHorizontal />,
};
