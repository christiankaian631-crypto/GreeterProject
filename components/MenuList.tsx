// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { Search, Utensils, X, Star, Flame, Coffee, Beer, GlassWater, Zap, Leaf, UtensilsCrossed, Gift, Sparkles, Ban, Pencil, Undo2 } from 'lucide-react';
import { MenuItem, AppSettings } from '../types';

interface Props {
  isDarkMode?: boolean;
  settings?: AppSettings;
  outletName?: string;
  userRole?: string | null;
  onUpdateSettings?: (settings: AppSettings) => Promise<void> | void;
}

export const OUTLETS_JAKARTA = [
  "SH THE BARN",
  "SH LB BULUS",
  "SH KEMANG",
  "SH CIPETE",
  "SH ALSUT",
  "SH BINTARO",
  "SH SMB SUMMARECON"
];

export const MENU_DATA_BANDUNG: MenuItem[] = [
  // --- SALAD ---
  { name: 'Organic Garden Salad', category: 'SALAD', price: 48000 },
  { name: 'Wakame Salad', category: 'SALAD', price: 48000 },
  { name: 'Prawn Salad', category: 'SALAD', price: 60000 },
  { name: 'Caesar Chicken Salad', category: 'SALAD', price: 68000 },
  { name: 'Thai Beef Salad', category: 'SALAD', price: 68000 },
  // --- SOUP ---
  { name: 'Chicken Cream Soup', category: 'SOUP', price: 55000 },
  { name: 'Justus Cream Soup', category: 'SOUP', price: 58000 },
  { name: 'Truffle Mushroom Soup', category: 'SOUP', price: 75000 },
  // --- LIGHT MEAL ---
  { name: 'French Fries', category: 'LIGHT MEAL', price: 35000 },
  { name: 'Truffle Fries', category: 'LIGHT MEAL', price: 49000 },
  { name: 'Fried Truffle Mushroom', category: 'LIGHT MEAL', price: 49000 },
  { name: 'Onion Ring', category: 'LIGHT MEAL', price: 49000 },
  { name: 'Fish & Chip', category: 'LIGHT MEAL', price: 60000 },
  { name: 'Sausage & Fries', category: 'LIGHT MEAL', price: 67000 },
  { name: 'Hot Wing', category: 'LIGHT MEAL', price: 67000 },
  { name: 'Calamari Ring', category: 'LIGHT MEAL', price: 79000 },
  { name: 'Mix Platter', category: 'LIGHT MEAL', price: 89000 },
  { name: 'Truffle Mac & Cheese', category: 'LIGHT MEAL', price: 89000 },
  { name: 'Chilli Beef Nachos', category: 'LIGHT MEAL', price: 89000 },
  // --- KIDS MEAL ---
  { name: 'Honey Chicken & Rice', category: 'KIDS MEAL', price: 59000 },
  { name: 'Chicken Sausage & Roll', category: 'KIDS MEAL', price: 55000 },
  { name: 'Creamy Cheesy Chicken with Fries', category: 'KIDS MEAL', price: 65000 },
  { name: 'Grill Germany Bratwurst', category: 'KIDS MEAL', price: 69000 },
  { name: 'Swedish Cheesy Meatballs', category: 'KIDS MEAL', price: 69000 },
  { name: 'Cheese Patty Steak', category: 'KIDS MEAL', price: 69000 },
  // --- SPECIALTY STEAK ---
  { name: 'Grill Chicken', category: 'SPECIALTY STEAK', price: 89000 },
  { name: 'Chicken Melt', category: 'SPECIALTY STEAK', price: 99000 },
  { name: 'Sirloin Entree Steak', category: 'SPECIALTY STEAK', price: 123000 },
  { name: 'Rib Eye Entree Steak', category: 'SPECIALTY STEAK', price: 123000 },
  { name: 'Tenderloin Entree Steak', category: 'SPECIALTY STEAK', price: 123000 },
  { name: 'Aussie Sirloin Grain Fed 150 Gram', category: 'SPECIALTY STEAK', price: 150000 },
  { name: 'Aussie Tenderloin Grain Fed 150 Gram', category: 'SPECIALTY STEAK', price: 155000 },
  { name: 'Aussie Sirloin Cheese Steak 150 Gram', category: 'SPECIALTY STEAK', price: 155000 },
  { name: 'Surf & Turf', category: 'SPECIALTY STEAK', price: 185000 },
  { name: 'Duck Confit Orange Sauce', category: 'SPECIALTY STEAK', price: 185000 },
  { name: 'Norwegian Salmon Steak 200 Gram', category: 'SPECIALTY STEAK', price: 198000 },
  { name: 'Sirloin Meltique Bifuteki 250 Gram', category: 'SPECIALTY STEAK', price: 198000 },
  { name: 'Rib Eye Meltique Bifuteki 250 Gram', category: 'SPECIALTY STEAK', price: 198000 },
  { name: 'Tenderloin Meltique Bifuteki 250 Gram', category: 'SPECIALTY STEAK', price: 198000 },
  { name: 'American Mix Grill', category: 'SPECIALTY STEAK', price: 210000 },
  { name: 'Aussie Sirloin Grain Fed 250 Gram', category: 'SPECIALTY STEAK', price: 260000 },
  { name: 'Aussie Tenderloin Grain Fed 250 Gram', category: 'SPECIALTY STEAK', price: 270000 },
  { name: 'Cheese Steak Tower', category: 'SPECIALTY STEAK', price: 270000 },
  { name: 'Striploin Grain Fed Au Poivre 250 Gram', category: 'SPECIALTY STEAK', price: 290000 },
  // --- PRIME SELECTION ---
  { name: 'Picanha Wagyu MB5 7+ 200 Gram', category: 'PRIME SELECTION', price: 320000 },
  { name: 'Pan Seared New York Cut 250 gram', category: 'PRIME SELECTION', price: 340000 },
  { name: 'Pan Seared Fillet Mignon 250 Gram', category: 'PRIME SELECTION', price: 360000 },
  { name: 'Wagyu MB5+ Korean Ribs Galbi 500 Gram', category: 'PRIME SELECTION', price: 380000 },
  { name: 'Grilled Black Angus Striploin 250 Gram', category: 'PRIME SELECTION', price: 420000 },
  { name: 'Grilled Black Angus Rib Eye 250 Gram', category: 'PRIME SELECTION', price: 440000 },
  { name: 'Grilled Black Angus Tenderloin 250 Gram', category: 'PRIME SELECTION', price: 460000 },
  { name: 'Pan Seared Black Angus Striploin 250 Gram', category: 'PRIME SELECTION', price: 420000 },
  { name: 'Pan Seared Black Angus Rib Eye 250 Gram', category: 'PRIME SELECTION', price: 440000 },
  { name: 'Pan Seared Black Angus Tenderloin 250 Gram', category: 'PRIME SELECTION', price: 460000 },
  { name: 'Grilled Striploin Wagyu MB5+ 250 Gram', category: 'PRIME SELECTION', price: 490000 },
  { name: 'Grilled Rib Eye Wagyu MB5+ 250 Gram', category: 'PRIME SELECTION', price: 520000 },
  { name: 'Grilled Tenderloin Wagyu MB5+ 250 Gram', category: 'PRIME SELECTION', price: 540000 },
  { name: 'Pan Seared Striploin Wagyu MB5+ 250 Gram', category: 'PRIME SELECTION', price: 490000 },
  { name: 'Pan Seared Rib Eye Wagyu MB5+ 250 Gram', category: 'PRIME SELECTION', price: 520000 },
  { name: 'Pan Seared Tenderloin Wagyu MB5+ 250 Gram', category: 'PRIME SELECTION', price: 540000 },
  { name: 'Dry Aged Rib Eye Wagyu MB5+ 250 Gram', category: 'PRIME SELECTION', price: 540000 },
  // --- BIG CUT ---
  { name: 'T-Bone Stockyard Wagyu MB5+ 500 Gram', category: 'BIG CUT', price: 950000 },
  { name: 'T-Bone Stockyard Wagyu MB5+ 1000 Gram', category: 'BIG CUT', price: 1950000 },
  { name: 'Tomahawk Stockyard Wagyu MB5+ 1500 Gram', category: 'BIG CUT', price: 950000 },
  // --- FAMILY SET ---
  { name: 'Family Barbeque', category: 'FAMILY SET', price: 580000 },
  { name: 'Cowboy Steak 400 Gram', category: 'FAMILY SET', price: 560000 },
  { name: 'Free Cowboy Steak 400 Gram', category: 'FAMILY SET', price: 0 },
  { name: 'Meat Lovers Platter (4 Person)', category: 'FAMILY SET', price: 580000 },
  { name: 'Premium Family Set (6 person)', category: 'FAMILY SET', price: 1650000 },
  { name: 'Fried Seafood Platter', category: 'FAMILY SET', price: 210000 },
  // --- WESTERN DELIGHT ---
  { name: 'John Dory', category: 'WESTERN DELIGHT', price: 79000 },
  { name: 'Chicken Pizzaiola', category: 'WESTERN DELIGHT', price: 79000 },
  { name: 'Chicken Cordon Bleu', category: 'WESTERN DELIGHT', price: 79000 },
  { name: 'Cheesy Chicken Truffle Spinach', category: 'WESTERN DELIGHT', price: 89000 },
  { name: 'American Fish & Chips', category: 'WESTERN DELIGHT', price: 89000 },
  { name: 'Chicken Maryland', category: 'WESTERN DELIGHT', price: 89000 },
  { name: 'Germany Platter', category: 'WESTERN DELIGHT', price: 99000 },
  { name: 'Beef Cordon Bleu', category: 'WESTERN DELIGHT', price: 99000 },
  { name: 'Beef Pizzaiola', category: 'WESTERN DELIGHT', price: 99000 },
  { name: 'Garlic Roasted Chicken', category: 'WESTERN DELIGHT', price: 110000 },
  { name: 'Beef Schnitzel', category: 'WESTERN DELIGHT', price: 120000 },
  { name: 'Florentine Butter Chicken', category: 'WESTERN DELIGHT', price: 99000 },
  // --- PASTA LOVERS ---
  { name: 'Spaghetti Bolognese', category: 'PASTA LOVERS', price: 65000 },
  { name: 'Spaghetti Salmon Aglio Olio', category: 'PASTA LOVERS', price: 76000 },
  { name: 'Spaghetti Prawn Aglio Olio', category: 'PASTA LOVERS', price: 76000 },
  { name: 'Beef Stroganoff Fettucine', category: 'PASTA LOVERS', price: 83000 },
  { name: 'Spaghetti Carbonara', category: 'PASTA LOVERS', price: 89000 },
  { name: 'Prawn Creamy Fettucine', category: 'PASTA LOVERS', price: 89000 },
  { name: 'Shrimp Pesto Fettucine', category: 'PASTA LOVERS', price: 89000 },
  { name: 'Cannelloni Beef Ragout', category: 'PASTA LOVERS', price: 99000 },
  // --- ASIAN ---
  { name: 'Chicken Katsu Curry Rice', category: 'ASIAN DELIGHT', price: 75000 },
  { name: 'Chicken Teriyaki', category: 'ASIAN DELIGHT', price: 75000 },
  { name: 'Chicken Amiyaki', category: 'ASIAN DELIGHT', price: 75000 },
  { name: 'Asian Chicken BBQ', category: 'ASIAN DELIGHT', price: 75000 },
  { name: 'Chicken & Hamburg Rice', category: 'ASIAN DELIGHT', price: 110000 },
  { name: 'Beef Hamburg Cheese Curry Rice', category: 'ASIAN DELIGHT', price: 110000 },
  { name: 'Beef Sirloin Curry Rice', category: 'ASIAN DELIGHT', price: 115000 },
  { name: 'Beef Tenderloin Teriyaki', category: 'ASIAN DELIGHT', price: 115000 },
  { name: 'Beef Sirloin Amiyaki', category: 'ASIAN DELIGHT', price: 125000 },
  { name: 'Salmon Teriyaki', category: 'ASIAN DELIGHT', price: 125000 },
  // --- INDONESIAN ---
  { name: 'Nasi Goreng Ayam', category: 'INDONESIAN FAVORITE', price: 59000 },
  { name: 'Nasi Goreng Sapi', category: 'INDONESIAN FAVORITE', price: 69000 },
  { name: 'Nasi Goreng Salmon', category: 'INDONESIAN FAVORITE', price: 79000 },
  { name: 'Nasi Goreng Seafood', category: 'INDONESIAN FAVORITE', price: 83000 },
  { name: 'Dory & Prawn Sambal Matah', category: 'INDONESIAN FAVORITE', price: 83000 },
  { name: 'Ayam Asap Sambal Matah', category: 'INDONESIAN FAVORITE', price: 83000 },
  { name: 'Bebek Crispy Balinese', category: 'INDONESIAN FAVORITE', price: 125000 },
  { name: 'Sop Iga Sapi', category: 'INDONESIAN FAVORITE', price: 149000 },
  { name: 'Sop Buntut Bakar', category: 'INDONESIAN FAVORITE', price: 159000 },
  { name: 'Sop Buntut Goreng', category: 'INDONESIAN FAVORITE', price: 159000 },
  { name: 'Sop Buntut Kuah', category: 'INDONESIAN FAVORITE', price: 159000 },
  { name: 'Iga Goreng Sambal Matah', category: 'INDONESIAN FAVORITE', price: 149000 },
  { name: 'Iga Goreng Sambal Ijo', category: 'INDONESIAN FAVORITE', price: 149000 },
  { name: 'Iga Bakar Sambal Matah', category: 'INDONESIAN FAVORITE', price: 149000 },
  { name: 'Iga Bakar Sambal Ijo', category: 'INDONESIAN FAVORITE', price: 149000 },
  { name: 'Iga Garang Asam', category: 'INDONESIAN FAVORITE', price: 149000 },
  { name: 'Dory Garang Asam', category: 'INDONESIAN FAVORITE', price: 89000 },
  { name: 'Sate Tenderloin Maranggi', category: 'INDONESIAN FAVORITE', price: 95000 },
  { name: 'Daging Asap Krispi 2 Rasa', category: 'INDONESIAN FAVORITE', price: 95000 },
  // --- NPD ---
  { name: 'Pan Seared Salmon With Truffle Pink Sauce', category: 'NPD', price: 0 },
  { name: 'Chicken Saltimbocca', category: 'NPD', price: 0 },
  { name: 'Mont Blanc', category: 'NPD', price: 0 },
  { name: 'Justus Iftar Platter', category: 'NPD', price: 280000 },
  { name: 'Grilled Aussie Short Ribs BBQ', category: 'NPD', price: 155000 },
  { name: 'Aussie Style Salted Prawn & Baby squid Fritters', category: 'NPD', price: 60000 },
  // --- BURGER & SANDWICH ---
  { name: 'Grilled Chicken Burger', category: 'BURGER & SANDWICH', price: 75000 },
  { name: 'Chicken Mushroom Sandwich', category: 'BURGER & SANDWICH', price: 85000 },
  { name: 'Old Fashioned Beef Burger', category: 'BURGER & SANDWICH', price: 95000 },
  { name: 'American Burger', category: 'BURGER & SANDWICH', price: 99000 },
  { name: 'Philadelphia Sandwich', category: 'BURGER & SANDWICH', price: 110000 },
  { name: 'Sirloin Cheese Steak Sandwich', category: 'BURGER & SANDWICH', price: 115000 },
  // --- DESSERT ---
  { name: 'Ice Cream Strawberry', category: 'DESSERT', price: 12000 },
  { name: 'Ice Cream Chocolate', category: 'DESSERT', price: 12000 },
  { name: 'Ice Cream Vanilla', category: 'DESSERT', price: 12000 },
  { name: 'Banana Split', category: 'DESSERT', price: 49000 },
  { name: 'Brownies Cheezie Sundae', category: 'DESSERT', price: 49000 },
  { name: 'Crème Brulee', category: 'DESSERT', price: 59000 },
  { name: 'Chocolate Lava', category: 'DESSERT', price: 59000 },
  { name: 'Choco Mille Crepes', category: 'DESSERT', price: 69000 },
  { name: 'Burn Cheese Cake', category: 'DESSERT', price: 69000 },
  { name: 'Classic Tiramisu', category: 'DESSERT', price: 69000 },
  // --- JUICE ---
  { name: 'Orange Juice', category: 'JUICE', price: 39000 },
  { name: 'Apple Juice', category: 'JUICE', price: 39000 },
  { name: 'Avocado Juice', category: 'JUICE', price: 39000 },
  { name: 'Strawberry Juice', category: 'JUICE', price: 39000 },
  { name: 'Banana Strawberry Juice', category: 'JUICE', price: 45000 },
  { name: 'Strawberry Orange', category: 'JUICE', price: 45000 },
  { name: 'Lychee Juice', category: 'JUICE', price: 49000 },
  { name: 'Blueberry Juice', category: 'JUICE', price: 49000 },
  { name: 'Strawberry Lychee Juice', category: 'JUICE', price: 49000 },
  { name: 'Orange Lychee Juice', category: 'JUICE', price: 49000 },
  // --- SMOOTHIES ---
  { name: 'Banana Smoothies', category: 'SMOOTHIES', price: 45000 },
  { name: 'Orange Smoothies', category: 'SMOOTHIES', price: 45000 },
  { name: 'Strawberry Smoothies', category: 'SMOOTHIES', price: 45000 },
  { name: 'Blueberry Smoothies', category: 'SMOOTHIES', price: 49000 },
  { name: 'Lychee Smoothies', category: 'SMOOTHIES', price: 49000 },
  { name: 'Mix Berries Smoothies', category: 'SMOOTHIES', price: 49000 },
  { name: 'Lychee Smoothies 500 ml', category: 'SMOOTHIES', price: 59000 },
  { name: 'Orange Smoothies 500 ml', category: 'SMOOTHIES', price: 59000 },
  { name: 'Strawberry Smoothies 500 ml', category: 'SMOOTHIES', price: 59000 },
  // --- WATER ---
  { name: 'Drinking Water', category: 'DRINKING & MINERAL WATER', price: 27000 },
  { name: 'Equil Natural', category: 'DRINKING & MINERAL WATER', price: 38000 },
  { name: 'Equil Sparkling', category: 'DRINKING & MINERAL WATER', price: 38000 },
  // --- SHAKE ---
  { name: 'Vanilla Milkshake', category: 'MILKSHAKE', price: 41000 },
  { name: 'Strawberry Milkshake', category: 'MILKSHAKE', price: 41000 },
  { name: 'Chocolate Milkshake', category: 'MILKSHAKE', price: 41000 },
  // --- SOFT DRINK ---
  { name: 'Coca Cola', category: 'SOFT DRINK', price: 28000 },
  { name: 'Coca Cola Float', category: 'SOFT DRINK', price: 33000 },
  // --- FRAPPE ---
  { name: 'Frappe Caramel Latte', category: 'FRAPPE', price: 47000 },
  { name: 'Frappe Royal Hazelnut', category: 'FRAPPE', price: 47000 },
  { name: 'Frappe Vanilla Blend', category: 'FRAPPE', price: 47000 },
  { name: 'Frappe Black Forest', category: 'FRAPPE', price: 47000 },
  // --- ARTISAN ---
  { name: 'Ceylon Green Tea', category: 'ARTISAN TEA', price: 39000 },
  { name: 'Ceylon Rose & Mint', category: 'ARTISAN TEA', price: 39000 },
  { name: 'Ceylon Ginger, Honey & Mint', category: 'ARTISAN TEA', price: 39000 },
  { name: 'Moroccan Mint', category: 'ARTISAN TEA', price: 39000 },
  // --- TEA ---
  { name: 'Ice Tea', category: 'TEA', price: 29000 },
  { name: 'Hot Chamomile Tea', category: 'TEA', price: 29000 },
  { name: 'Hot Peppermint Tea', category: 'TEA', price: 29000 },
  { name: 'Hot Earl Grey Tea', category: 'TEA', price: 29000 },
  { name: 'Hot English Breakfast tea', category: 'TEA', price: 29000 },
  { name: 'Hot Green Tea', category: 'TEA', price: 29000 },
  { name: 'Hot Lemon Tea', category: 'TEA', price: 29000 },
  { name: 'Ice Lemon Tea', category: 'TEA', price: 35000 },
  { name: 'Ice Apple Tea', category: 'TEA', price: 35000 },
  { name: 'Ice Orange Tea', category: 'TEA', price: 35000 },
  { name: 'Ice Lychee Tea', category: 'TEA', price: 42000 },
  { name: 'Ice Peach Tea', category: 'TEA', price: 42000 },
  { name: 'Apple Sarsaparilla', category: 'TEA', price: 43000 },
  { name: 'Lychee Sarsaparilla', category: 'TEA', price: 43000 },
  { name: 'Peach Sarsaparilla', category: 'TEA', price: 43000 },
  // --- COFFEE ---
  { name: 'Espresso', category: 'COFFEE', price: 21000 },
  { name: 'Hot Americano', category: 'COFFEE', price: 26000 },
  { name: 'Ice Americano', category: 'COFFEE', price: 31000 },
  { name: 'Piccolo', category: 'COFFEE', price: 35000 },
  { name: 'Hot Cappuccino', category: 'COFFEE', price: 34000 },
  { name: 'Ice Cappuccino', category: 'COFFEE', price: 39000 },
  { name: 'Hot Caffe Latte', category: 'COFFEE', price: 34000 },
  { name: 'Ice Caffe Latte', category: 'COFFEE', price: 39000 },
  { name: 'Hot Mocha', category: 'COFFEE', price: 34000 },
  { name: 'Ice Mocha', category: 'COFFEE', price: 39000 },
  { name: 'Ice Aren Latte', category: 'COFFEE', price: 36000 },
  { name: 'Ice Coffee Aren', category: 'COFFEE', price: 36000 },
  { name: 'Royal Creamy Aren', category: 'COFFEE', price: 39000 },
  { name: 'Doppio Iced Shaken', category: 'COFFEE', price: 39000 },
  { name: 'Orange Coffee', category: 'COFFEE', price: 39000 },
  { name: 'Affogato', category: 'COFFEE', price: 38000 },
  { name: 'Flat White', category: 'COFFEE', price: 38000 },
  { name: 'Hot Creme Brulee', category: 'COFFEE', price: 38000 },
  { name: 'Nutmeg', category: 'COFFEE', price: 39000 },
  { name: 'Hot Caramel Latte', category: 'COFFEE', price: 38000 },
  { name: 'Ice Caramel Latte', category: 'COFFEE', price: 41000 },
  { name: 'Hot Hazelnut Latte', category: 'COFFEE', price: 38000 },
  { name: 'Ice Hazelnut Latte', category: 'COFFEE', price: 41000 },
  { name: 'Hot Vanilla Latte', category: 'COFFEE', price: 38000 },
  { name: 'Ice Vanilla Latte', category: 'COFFEE', price: 41000 },
  { name: 'Doppio 500 Ml', category: 'COFFEE', price: 79000 },
  { name: 'Nutmeg 500 Ml', category: 'COFFEE', price: 79000 },
  { name: 'Ice Aren Latte 1 Liter', category: 'COFFEE', price: 99000 },
  { name: 'Ice Coffee Aren 1 Liter', category: 'COFFEE', price: 99000 },
  // --- MANUAL ---
  { name: 'V60', category: 'MANUAL BREW', price: 31000 },
  { name: 'Vietnam Drip', category: 'MANUAL BREW', price: 31000 },
  { name: 'MB Iced', category: 'MANUAL BREW', price: 31000 },
  // --- CHOCO ---
  { name: 'Hot Choco Classic', category: 'CHOCOLATE', price: 37000 },
  { name: 'Ice Choco Classic', category: 'CHOCOLATE', price: 49000 },
  { name: 'Hot Choco Mint', category: 'CHOCOLATE', price: 37000 },
  { name: 'Ice Choco Mint', category: 'CHOCOLATE', price: 49000 },
  { name: 'Hot Choco Vanilla', category: 'CHOCOLATE', price: 37000 },
  { name: 'Ice Choco Vanilla', category: 'CHOCOLATE', price: 49000 },
  { name: 'Hot Choco Hazelnut', category: 'CHOCOLATE', price: 37000 },
  { name: 'Ice Choco Hazelnut', category: 'CHOCOLATE', price: 49000 },
  { name: 'Hot Choco Caramel', category: 'CHOCOLATE', price: 37000 },
  { name: 'Ice Choco Caramel', category: 'CHOCOLATE', price: 49000 },
  // --- ICED BLENDED ---
  { name: 'Banana Vanilla Cookies', category: 'ICED BLENDED', price: 47000 },
  { name: 'Avocado Oreo Blend', category: 'ICED BLENDED', price: 47000 },
  { name: 'Banana Choco Caramel', category: 'ICED BLENDED', price: 47000 },
  { name: 'Mochafrost Blend', category: 'ICED BLENDED', price: 47000 },
  // --- MOCKTAIL ---
  { name: 'Virgin Pina Colada', category: 'MOCKTAIL', price: 41000 },
  { name: 'La Kawista', category: 'MOCKTAIL', price: 41000 },
  { name: 'Tropical Pale', category: 'MOCKTAIL', price: 41000 },
  { name: 'Sweet Lavandula', category: 'MOCKTAIL', price: 41000 },
  { name: 'Cassavanova', category: 'MOCKTAIL', price: 41000 },
  { name: 'Batterosa', category: 'MOCKTAIL', price: 41000 },
  { name: 'Spice Sensation', category: 'MOCKTAIL', price: 41000 },
  { name: 'Red Bitter Sunrise', category: 'MOCKTAIL', price: 47000 },
  { name: 'Orange Passion', category: 'MOCKTAIL', price: 47000 },
  { name: 'Strawberry Mojito', category: 'MOCKTAIL', price: 47000 },
  { name: 'Lychee Mojito', category: 'MOCKTAIL', price: 47000 },
  // --- FREE ---
  { name: 'Free Ice Tea', category: 'FREE MENU', price: 0 },
  { name: 'Free Ice Lemon Tea', category: 'FREE MENU', price: 0 },
  { name: 'Free Ice Cream Vanilla', category: 'FREE MENU', price: 0 },
  { name: 'Free Ice Cream Cokelat', category: 'FREE MENU', price: 0 },
  { name: 'Free Ice Cream Strawberry', category: 'FREE MENU', price: 0 },
  { name: 'Free Cassavanova', category: 'FREE MENU', price: 0 },
  { name: 'Free Sweet Lavandula', category: 'FREE MENU', price: 0 },
  { name: 'Free Orange Juice', category: 'FREE MENU', price: 0 },
  { name: 'Free Brownies cheezie sundae', category: 'FREE MENU', price: 0 }
];

export const MENU_DATA_JAKARTA: MenuItem[] = [
  // --- SALAD ---
  { name: 'Organic Garden Salad', category: 'SALAD', price: 52000 },
  { name: 'Wakame Salad', category: 'SALAD', price: 52000 },
  { name: 'Prawn Salad', category: 'SALAD', price: 65000 },
  { name: 'Caesar Chicken Salad', category: 'SALAD', price: 79000 },
  { name: 'Thai Beef Salad', category: 'SALAD', price: 79000 },
  // --- SOUP ---
  { name: 'Chicken Cream Soup', category: 'SOUP', price: 66000 },
  { name: 'Justus Cream Soup', category: 'SOUP', price: 68000 },
  { name: 'Truffle Mushroom Soup', category: 'SOUP', price: 87000 },
  // --- LIGHT MEAL ---
  { name: 'French Fries', category: 'LIGHT MEAL', price: 37000 },
  { name: 'Truffle Fries', category: 'LIGHT MEAL', price: 55000 },
  { name: 'Fried Truffle Mushroom', category: 'LIGHT MEAL', price: 65000 },
  { name: 'Onion Ring', category: 'LIGHT MEAL', price: 65000 },
  { name: 'Fish & Chip', category: 'LIGHT MEAL', price: 72000 },
  { name: 'Sausage & Fries', category: 'LIGHT MEAL', price: 65000 },
  { name: 'Hot Wing', category: 'LIGHT MEAL', price: 72000 },
  { name: 'Calamari Ring', category: 'LIGHT MEAL', price: 87000 },
  { name: 'Mix Platter', category: 'LIGHT MEAL', price: 99000 },
  { name: 'Truffle Mac & Cheese', category: 'LIGHT MEAL', price: 99000 },
  { name: 'Chilli Beef Nachos', category: 'LIGHT MEAL', price: 99000 },
  // --- KIDS MEAL ---
  { name: 'Honey Chicken & Rice', category: 'KIDS MEAL', price: 79000 },
  { name: 'Chicken Sausage & Roll', category: 'KIDS MEAL', price: 67000 },
  { name: 'Creamy Cheesy Chicken with Fries', category: 'KIDS MEAL', price: 67000 },
  { name: 'Grill Germany Bratwurst', category: 'KIDS MEAL', price: 79000 },
  { name: 'Swedish Cheesy Meatballs', category: 'KIDS MEAL', price: 79000 },
  { name: 'Cheese Patty Steak', category: 'KIDS MEAL', price: 79000 },
  // --- SPECIALTY STEAK ---
  { name: 'Grill Chicken', category: 'SPECIALTY STEAK', price: 99000 },
  { name: 'Chicken Melt', category: 'SPECIALTY STEAK', price: 110000 },
  { name: 'Sirloin Entree Steak', category: 'SPECIALTY STEAK', price: 132000 },
  { name: 'Rib Eye Entree Steak', category: 'SPECIALTY STEAK', price: 132000 },
  { name: 'Tenderloin Entree Steak', category: 'SPECIALTY STEAK', price: 132000 },
  { name: 'Aussie Sirloin Grain Fed 150 Gram', category: 'SPECIALTY STEAK', price: 165000 },
  { name: 'Aussie Tenderloin Grain Fed 150 Gram', category: 'SPECIALTY STEAK', price: 175000 },
  { name: 'Aussie Sirloin Cheese Steak 150 Gram', category: 'SPECIALTY STEAK', price: 175000 },
  { name: 'Surf & Turf', category: 'SPECIALTY STEAK', price: 195000 },
  { name: 'Duck Confit Orange Sauce', category: 'SPECIALTY STEAK', price: 195000 },
  { name: 'Norwegian Salmon Steak 200 Gram', category: 'SPECIALTY STEAK', price: 220000 },
  { name: 'Sirloin Meltique Bifuteki 250 Gram', category: 'SPECIALTY STEAK', price: 210000 },
  { name: 'Rib Eye Meltique Bifuteki 250 Gram', category: 'SPECIALTY STEAK', price: 210000 },
  { name: 'Tenderloin Meltique Bifuteki 250 Gram', category: 'SPECIALTY STEAK', price: 210000 },
  { name: 'American Mix Grill', category: 'SPECIALTY STEAK', price: 240000 },
  { name: 'Aussie Sirloin Grain Fed 250 Gram', category: 'SPECIALTY STEAK', price: 290000 },
  { name: 'Aussie Tenderloin Grain Fed 250 Gram', category: 'SPECIALTY STEAK', price: 300000 },
  { name: 'Cheese Steak Tower', category: 'SPECIALTY STEAK', price: 280000 },
  { name: 'Striploin Grain Fed Au Poivre 250 Gram', category: 'SPECIALTY STEAK', price: 300000 },
  // --- PRIME SELECTION ---
  { name: 'Picanha Wagyu MB5 7+ 200 Gram', category: 'PRIME SELECTION', price: 365000 },
  { name: 'Pan Seared New York Cut 250 gram', category: 'PRIME SELECTION', price: 365000 },
  { name: 'Pan Seared Fillet Mignon 250 Gram', category: 'PRIME SELECTION', price: 385000 },
  { name: 'Wagyu MB5+ Korean Ribs Galbi 500 Gram', category: 'PRIME SELECTION', price: 410000 },
  { name: 'Grilled Black Angus Striploin 250 Gram', category: 'PRIME SELECTION', price: 450000 },
  { name: 'Grilled Black Angus Rib Eye 250 Gram', category: 'PRIME SELECTION', price: 470000 },
  { name: 'Grilled Black Angus Tenderloin 250 Gram', category: 'PRIME SELECTION', price: 490000 },
  { name: 'Pan Seared Black Angus Striploin 250 Gram', category: 'PRIME SELECTION', price: 450000 },
  { name: 'Pan Seared Black Angus Rib Eye 250 Gram', category: 'PRIME SELECTION', price: 470000 },
  { name: 'Pan Seared Black Angus Tenderloin 250 Gram', category: 'PRIME SELECTION', price: 490000 },
  { name: 'Grilled Striploin Wagyu MB5+ 250 Gram', category: 'PRIME SELECTION', price: 540000 },
  { name: 'Grilled Rib Eye Wagyu MB5+ 250 Gram', category: 'PRIME SELECTION', price: 560000 },
  { name: 'Grilled Tenderloin Wagyu MB5+ 250 Gram', category: 'PRIME SELECTION', price: 580000 },
  { name: 'Pan Seared Striploin Wagyu MB5+ 250 Gram', category: 'PRIME SELECTION', price: 540000 },
  { name: 'Pan Seared Rib Eye Wagyu MB5+ 250 Gram', category: 'PRIME SELECTION', price: 560000 },
  { name: 'Pan Seared Tenderloin Wagyu MB5+ 250 Gram', category: 'PRIME SELECTION', price: 580000 },
  { name: 'Dry Aged Rib Eye Wagyu MB5+ 250 Gram', category: 'PRIME SELECTION', price: 580000 },
  // --- BIG CUT ---
  { name: 'T-Bone Stockyard Wagyu MB5+ 500 Gram', category: 'BIG CUT', price: 995000 },
  { name: 'T-Bone Stockyard Wagyu MB5+ 1000 Gram', category: 'BIG CUT', price: 1950000 },
  { name: 'Tomahawk Stockyard Wagyu MB5+ 1500 Gram', category: 'BIG CUT', price: 2100000 },
  // --- FAMILY SET ---
  { name: 'Family Barbeque', category: 'FAMILY SET', price: 580000 },
  { name: 'Cowboy Steak 400 Gram', category: 'FAMILY SET', price: 560000 },
  { name: 'Free Cowboy Steak 400 Gram', category: 'FAMILY SET', price: 0 },
  { name: 'Meat Lovers Platter (4 Person)', category: 'FAMILY SET', price: 580000 },
  { name: 'Premium Family Set (6 person)', category: 'FAMILY SET', price: 1650000 },
  { name: 'Fried Seafood Platter', category: 'FAMILY SET', price: 210000 },
  // --- WESTERN DELIGHT ---
  { name: 'John Dory', category: 'WESTERN DELIGHT', price: 79000 },
  { name: 'Chicken Pizzaiola', category: 'WESTERN DELIGHT', price: 79000 },
  { name: 'Chicken Cordon Bleu', category: 'WESTERN DELIGHT', price: 89000 },
  { name: 'Cheesy Chicken Truffle Spinach', category: 'WESTERN DELIGHT', price: 95000 },
  { name: 'American Fish & Chips', category: 'WESTERN DELIGHT', price: 99000 },
  { name: 'Chicken Maryland', category: 'WESTERN DELIGHT', price: 99000 },
  { name: 'Germany Platter', category: 'WESTERN DELIGHT', price: 99000 },
  { name: 'Beef Cordon Bleu', category: 'WESTERN DELIGHT', price: 115000 },
  { name: 'Beef Pizzaiola', category: 'WESTERN DELIGHT', price: 115000 },
  { name: 'Garlic Roasted Chicken', category: 'WESTERN DELIGHT', price: 125000 },
  { name: 'Beef Schnitzel', category: 'WESTERN DELIGHT', price: 135000 },
  { name: 'Florentine Butter Chicken', category: 'WESTERN DELIGHT', price: 115000 },
  // --- PASTA LOVERS ---
  { name: 'Spaghetti Bolognese', category: 'PASTA LOVERS', price: 69000 },
  { name: 'Spaghetti Salmon Aglio Olio', category: 'PASTA LOVERS', price: 79000 },
  { name: 'Spaghetti Prawn Aglio Olio', category: 'PASTA LOVERS', price: 79000 },
  { name: 'Beef Stroganoff Fettucine', category: 'PASTA LOVERS', price: 89000 },
  { name: 'Spaghetti Carbonara', category: 'PASTA LOVERS', price: 99000 },
  { name: 'Prawn Creamy Fettucine', category: 'PASTA LOVERS', price: 99000 },
  { name: 'Shrimp Pesto Fettucine', category: 'PASTA LOVERS', price: 99000 },
  { name: 'Cannelloni Beef Ragout', category: 'PASTA LOVERS', price: 110000 },
  // --- ASIAN ---
  { name: 'Chicken Katsu Curry Rice', category: 'ASIAN DELIGHT', price: 83000 },
  { name: 'Chicken Teriyaki', category: 'ASIAN DELIGHT', price: 83000 },
  { name: 'Chicken Amiyaki', category: 'ASIAN DELIGHT', price: 83000 },
  { name: 'Asian Chicken BBQ', category: 'ASIAN DELIGHT', price: 83000 },
  { name: 'Chicken & Hamburg Rice', category: 'ASIAN DELIGHT', price: 120000 },
  { name: 'Beef Hamburg Cheese Curry Rice', category: 'ASIAN DELIGHT', price: 120000 },
  { name: 'Beef Sirloin Curry Rice', category: 'ASIAN DELIGHT', price: 129000 },
  { name: 'Beef Tenderloin Teriyaki', category: 'ASIAN DELIGHT', price: 129000 },
  { name: 'Beef Sirloin Amiyaki', category: 'ASIAN DELIGHT', price: 140000 },
  { name: 'Salmom Teriyaki', category: 'ASIAN DELIGHT', price: 140000 },
  // --- INDONESIAN ---
  { name: 'Nasi Goreng Ayam', category: 'INDONESIAN FAVORITE', price: 65000 },
  { name: 'Nasi Goreng Sapi', category: 'INDONESIAN FAVORITE', price: 75000 },
  { name: 'Nasi Goreng Salmon', category: 'INDONESIAN FAVORITE', price: 85000 },
  { name: 'Nasi Goreng Seafood', category: 'INDONESIAN FAVORITE', price: 89000 },
  { name: 'Dory & Prawn Sambal Matah', category: 'INDONESIAN FAVORITE', price: 89000 },
  { name: 'Ayam Asap Sambal Matah', category: 'INDONESIAN FAVORITE', price: 89000 },
  { name: 'Bebek Crispy Balinese', category: 'INDONESIAN FAVORITE', price: 130000 },
  { name: 'Sop Iga Sapi', category: 'INDONESIAN FAVORITE', price: 159000 },
  { name: 'Sop Buntut Bakar', category: 'INDONESIAN FAVORITE', price: 169000 },
  { name: 'Sop Buntut Goreng', category: 'INDONESIAN FAVORITE', price: 169000 },
  { name: 'Sop Buntut Kuah', category: 'INDONESIAN FAVORITE', price: 169000 },
  { name: 'Iga Goreng Sambal Matah', category: 'INDONESIAN FAVORITE', price: 159000 },
  { name: 'Iga Goreng Sambal Ijo', category: 'INDONESIAN FAVORITE', price: 159000 },
  { name: 'Iga Bakar Sambal Matah', category: 'INDONESIAN FAVORITE', price: 159000 },
  { name: 'Iga Bakar Sambal Ijo', category: 'INDONESIAN FAVORITE', price: 159000 },
  { name: 'Iga Garang Asam', category: 'INDONESIAN FAVORITE', price: 159000 },
  { name: 'Dory Garang Asam', category: 'INDONESIAN FAVORITE', price: 99000 },
  { name: 'Sate Tenderloin Maranggi', category: 'INDONESIAN FAVORITE', price: 99000 },
  { name: 'Daging Asap Krispi 2 Rasa', category: 'INDONESIAN FAVORITE', price: 99000 },
  // --- NPD ---
  { name: 'Pan Seared Salmon With Truffle Pink Sauce', category: 'NPD', price: 230000 },
  { name: 'Chicken Saltimbocca', category: 'NPD', price: 145000 },
  { name: 'Mont Blanc', category: 'NPD', price: 0 },
  { name: 'Justus Iftar Platter', category: 'NPD', price: 290000 },
  { name: 'Grilled Aussie Short Ribs BBQ', category: 'NPD', price: 165000 },
  { name: 'Aussie Style Salted Prawn & Baby squid Fritters', category: 'NPD', price: 65000 },
  // --- BURGER & SANDWICH ---
  { name: 'Grilled Chicken Burger', category: 'BURGER & SANDWICH', price: 85000 },
  { name: 'Chicken Mushroom Sandwich', category: 'BURGER & SANDWICH', price: 89000 },
  { name: 'Old Fashioned Beef Burger', category: 'BURGER & SANDWICH', price: 99000 },
  { name: 'American Burger', category: 'BURGER & SANDWICH', price: 115000 },
  { name: 'Philadelphia Sandwich', category: 'BURGER & SANDWICH', price: 120000 },
  { name: 'Sirloin Cheese Steak Sandwich', category: 'BURGER & SANDWICH', price: 125000 },
  // --- DESSERT ---
  { name: 'Ice Cream Strawberry', category: 'DESSERT', price: 12000 },
  { name: 'Ice Cream Chocolate', category: 'DESSERT', price: 12000 },
  { name: 'Ice Cream Vanilla', category: 'DESSERT', price: 12000 },
  { name: 'Banana Split', category: 'DESSERT', price: 49000 },
  { name: 'Brownies Cheezie Sundae', category: 'DESSERT', price: 49000 },
  { name: 'Crème Brulee', category: 'DESSERT', price: 59000 },
  { name: 'Chocolate Lava', category: 'DESSERT', price: 69000 },
  { name: 'Choco Mille Crepes', category: 'DESSERT', price: 69000 },
  { name: 'Burn Cheese Cake', category: 'DESSERT', price: 78000 },
  { name: 'Classic Tiramisu', category: 'DESSERT', price: 78000 },
  // --- JUICE ---
  { name: 'Orange Juice', category: 'JUICE', price: 43000 },
  { name: 'Apple Juice', category: 'JUICE', price: 43000 },
  { name: 'Avocado Juice', category: 'JUICE', price: 43000 },
  { name: 'Strawberry Juice', category: 'JUICE', price: 43000 },
  { name: 'Banana Strawberry Juice', category: 'JUICE', price: 49000 },
  { name: 'Strawberry Orange', category: 'JUICE', price: 49000 },
  { name: 'Lychee Juice', category: 'JUICE', price: 55000 },
  { name: 'Blueberry Juice', category: 'JUICE', price: 55000 },
  { name: 'Strawberry Lychee Juice', category: 'JUICE', price: 55000 },
  { name: 'Orange Lychee Juice', category: 'JUICE', price: 55000 },
  // --- SMOOTHIES ---
  { name: 'Banana Smoothies', category: 'SMOOTHIES', price: 48000 },
  { name: 'Orange Smoothies', category: 'SMOOTHIES', price: 48000 },
  { name: 'Strawberry Smoothies', category: 'SMOOTHIES', price: 48000 },
  { name: 'Blueberry Smoothies', category: 'SMOOTHIES', price: 55000 },
  { name: 'Lychee Smoothies', category: 'SMOOTHIES', price: 55000 },
  { name: 'Mix Berries Smoothies', category: 'SMOOTHIES', price: 55000 },
  { name: 'Lychee Smoothies 500 ml', category: 'SMOOTHIES', price: 70000 },
  { name: 'Orange Smoothies 500 ml', category: 'SMOOTHIES', price: 70000 },
  { name: 'Strawberry Smoothies 500 ml', category: 'SMOOTHIES', price: 70000 },
  // --- WATER ---
  { name: 'Drinking Water', category: 'DRINKING & MINERAL WATER', price: 29000 },
  { name: 'Equil Natural', category: 'DRINKING & MINERAL WATER', price: 40000 },
  { name: 'Equil Sparkling', category: 'DRINKING & MINERAL WATER', price: 45000 },
  // --- SHAKE ---
  { name: 'Vanilla Milkshake', category: 'MILKSHAKE', price: 48000 },
  { name: 'Strawberry Milkshake', category: 'MILKSHAKE', price: 48000 },
  { name: 'Chocolate Milkshake', category: 'MILKSHAKE', price: 48000 },
  // --- SOFT DRINK ---
  { name: 'Coca Cola', category: 'SOFT DRINK', price: 29000 },
  { name: 'Coca Cola Float', category: 'SOFT DRINK', price: 35000 },
  // --- FRAPPE ---
  { name: 'Frappe Caramel Latte', category: 'FRAPPE', price: 49000 },
  { name: 'Frappe Royal Hazelnut', category: 'FRAPPE', price: 49000 },
  { name: 'Frappe Vanilla Blend', category: 'FRAPPE', price: 49000 },
  { name: 'Frappe Black Forest', category: 'FRAPPE', price: 49000 },
  // --- ARTISAN ---
  { name: 'Ceylon Green Tea', category: 'ARTISAN TEA', price: 44000 },
  { name: 'Ceylon Rose & Mint', category: 'ARTISAN TEA', price: 44000 },
  { name: 'Ceylon Ginger, Honey & Mint', category: 'ARTISAN TEA', price: 44000 },
  { name: 'Moroccan Mint', category: 'ARTISAN TEA', price: 44000 },
  // --- TEA ---
  { name: 'Ice Tea', category: 'TEA', price: 35000 },
  { name: 'Hot Chamomile Tea', category: 'TEA', price: 36000 },
  { name: 'Hot Peppermint Tea', category: 'TEA', price: 36000 },
  { name: 'Hot Earl Grey Tea', category: 'TEA', price: 36000 },
  { name: 'Hot English Breakfast tea', category: 'TEA', price: 36000 },
  { name: 'Hot Green Tea', category: 'TEA', price: 36000 },
  { name: 'Hot Lemon Tea', category: 'TEA', price: 36000 },
  { name: 'Ice Lemon Tea', category: 'TEA', price: 39000 },
  { name: 'Ice Apple Tea', category: 'TEA', price: 39000 },
  { name: 'Ice Orange Tea', category: 'TEA', price: 39000 },
  { name: 'Ice Lychee Tea', category: 'TEA', price: 49000 },
  { name: 'Ice Peach Tea', category: 'TEA', price: 49000 },
  { name: 'Apple Sarsaparilla', category: 'TEA', price: 49000 },
  { name: 'Lychee Sarsaparilla', category: 'TEA', price: 49000 },
  { name: 'Peach Sarsaparilla', category: 'TEA', price: 49000 },
  // --- COFFEE ---
  { name: 'Espresso', category: 'COFFEE', price: 22000 },
  { name: 'Hot Americano', category: 'COFFEE', price: 29000 },
  { name: 'Ice Americano', category: 'COFFEE', price: 33000 },
  { name: 'Piccolo', category: 'COFFEE', price: 37000 },
  { name: 'Hot Cappuccino', category: 'COFFEE', price: 38000 },
  { name: 'Ice Cappuccino', category: 'COFFEE', price: 43000 },
  { name: 'Hot Caffe Latte', category: 'COFFEE', price: 38000 },
  { name: 'Ice Caffe Latte', category: 'COFFEE', price: 43000 },
  { name: 'Hot Mocha', category: 'COFFEE', price: 38000 },
  { name: 'Ice Mocha', category: 'COFFEE', price: 43000 },
  { name: 'Ice Aren Latte', category: 'COFFEE', price: 43000 },
  { name: 'Ice Coffee Aren', category: 'COFFEE', price: 43000 },
  { name: 'Royal Creamy Aren', category: 'COFFEE', price: 46000 },
  { name: 'Doppio Iced Shaken', category: 'COFFEE', price: 43000 },
  { name: 'Orange Coffee', category: 'COFFEE', price: 43000 },
  { name: 'Affogato', category: 'COFFEE', price: 43000 },
  { name: 'Flat White', category: 'COFFEE', price: 39000 },
  { name: 'Hot Creme Brulee', category: 'COFFEE', price: 39000 },
  { name: 'Ice Creme Brulee', category: 'COFFEE', price: 39000 },
  { name: 'Hot Caramel Latte', category: 'COFFEE', price: 39000 },
  { name: 'Ice Caramel Latte', category: 'COFFEE', price: 46000 },
  { name: 'Hot Hazelnut Latte', category: 'COFFEE', price: 39000 },
  { name: 'Ice Hazelnut Latte', category: 'COFFEE', price: 46000 },
  { name: 'Hot Vanilla Latte', category: 'COFFEE', price: 39000 },
  { name: 'Ice Vanilla Latte', category: 'COFFEE', price: 46000 },
  { name: 'Doppio 500 Ml', category: 'COFFEE', price: 83000 },
  { name: 'Nutmeg 500 Ml', category: 'COFFEE', price: 83000 },
  { name: 'Ice Aren Latte 1 Liter', category: 'COFFEE', price: 99000 },
  { name: 'Ice Coffee Aren 1 Liter', category: 'COFFEE', price: 99000 },
  // --- MANUAL ---
  { name: 'V60', category: 'MANUAL BREW', price: 35000 },
  { name: 'Vietnam Drip', category: 'MANUAL BREW', price: 35000 },
  { name: 'MB Iced', category: 'MANUAL BREW', price: 35000 },
  // --- CHOCO ---
  { name: 'Hot Choco Classic', category: 'CHOCOLATE', price: 39000 },
  { name: 'Ice Choco Classic', category: 'CHOCOLATE', price: 55000 },
  { name: 'Hot Choco Mint', category: 'CHOCOLATE', price: 39000 },
  { name: 'Ice Choco Mint', category: 'CHOCOLATE', price: 55000 },
  { name: 'Hot Choco Vanilla', category: 'CHOCOLATE', price: 39000 },
  { name: 'Ice Choco Vanilla', category: 'CHOCOLATE', price: 55000 },
  { name: 'Hot Choco Hazelnut', category: 'CHOCOLATE', price: 39000 },
  { name: 'Ice Choco Hazelnut', category: 'CHOCOLATE', price: 55000 },
  { name: 'Hot Choco Caramel', category: 'CHOCOLATE', price: 39000 },
  { name: 'Ice Choco Caramel', category: 'CHOCOLATE', price: 55000 },
  // --- ICED BLENDED ---
  { name: 'Banana Vanilla Cookies', category: 'ICED BLENDED', price: 49000 },
  { name: 'Avocado Oreo Blend', category: 'ICED BLENDED', price: 49000 },
  { name: 'Banana Choco Caramel', category: 'ICED BLENDED', price: 49000 },
  { name: 'Mochafrost Blend', category: 'ICED BLENDED', price: 49000 },
  // --- MOCKTAIL ---
  { name: 'Virgin Pina Colada', category: 'MOCKTAIL', price: 47000 },
  { name: 'La Kawista', category: 'MOCKTAIL', price: 47000 },
  { name: 'Tropical Pale', category: 'MOCKTAIL', price: 47000 },
  { name: 'Sweet Lavandula', category: 'MOCKTAIL', price: 47000 },
  { name: 'Cassavanova', category: 'MOCKTAIL', price: 47000 },
  { name: 'Batterosa', category: 'MOCKTAIL', price: 47000 },
  { name: 'Spice Sensation', category: 'MOCKTAIL', price: 47000 },
  { name: 'Red Bitter Sunrise', category: 'MOCKTAIL', price: 49000 },
  { name: 'Orange Passion', category: 'MOCKTAIL', price: 49000 },
  { name: 'Strawberry Mojito', category: 'MOCKTAIL', price: 49000 },
  { name: 'Lychee Mojito', category: 'MOCKTAIL', price: 49000 },
  // --- FREE ---
  { name: 'Free Ice Tea', category: 'FREE MENU', price: 0 },
  { name: 'Free Ice Lemon Tea', category: 'FREE MENU', price: 0 },
  { name: 'Free Ice Cream Vanilla', category: 'FREE MENU', price: 0 },
  { name: 'Free Ice Cream Cokelat', category: 'FREE MENU', price: 0 },
  { name: 'Free Ice Cream Strawberry', category: 'FREE MENU', price: 0 },
  { name: 'Free Cassavanova', category: 'FREE MENU', price: 0 },
  { name: 'Free Sweet Lavandula', category: 'FREE MENU', price: 0 },
  { name: 'Free Orange Juice', category: 'FREE MENU', price: 0 },
  { name: 'Free Brownies cheezie sundae', category: 'FREE MENU', price: 0 }
];

export const MENU_DATA = MENU_DATA_BANDUNG; // Default legacy reference

const MenuList: React.FC<Props> = ({ isDarkMode, settings, outletName, userRole, onUpdateSettings }) => {
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editedPrice, setEditedPrice] = useState<string>('');

  const activeRegionMenu = useMemo(() => {
    const isJakarta = outletName && OUTLETS_JAKARTA.includes(outletName);
    return isJakarta ? MENU_DATA_JAKARTA : MENU_DATA_BANDUNG;
  }, [outletName]);

  const allMenu = useMemo(() => {
    const baseMenu = [...activeRegionMenu, ...(settings?.customMenu || [])];
    if (settings?.menuPriceOverrides) {
      return baseMenu.map(item => ({
        ...item,
        price: settings.menuPriceOverrides[item.name] !== undefined ? settings.menuPriceOverrides[item.name] : item.price
      }));
    }
    return baseMenu;
  }, [settings?.customMenu, settings?.menuPriceOverrides, activeRegionMenu]);

  const filteredMenu = useMemo(() => {
    return allMenu.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, allMenu]);

  const categories = useMemo(() => {
    const foodPriority = [
      'SALAD', 'SOUP', 'LIGHT MEAL', 'KIDS MEAL', 'SPECIALTY STEAK', 'PRIME SELECTION', 
      'BIG CUT', 'FAMILY SET', 'WESTERN DELIGHT', 'PASTA LOVERS', 'ASIAN DELIGHT', 
      'INDONESIAN FAVORITE', 'BURGER & SANDWICH', 'NPD', 'DESSERT'
    ];
    const beveragePriority = [
      'JUICE', 'SMOOTHIES', 'DRINKING & MINERAL WATER', 'MILKSHAKE', 'SOFT DRINK', 
      'FRAPPE', 'ARTISAN TEA', 'TEA', 'COFFEE', 'MANUAL BREW', 'CHOCOLATE', 
      'ICED BLENDED', 'MOCKTAIL', 'FREE MENU'
    ];

    const uniqueCategories = Array.from(new Set(allMenu.map(m => m.category))) as string[];
    
    return uniqueCategories.filter(cat => filteredMenu.some(item => item.category === cat)).sort((a, b) => {
      const aUpper = a.toUpperCase();
      const bUpper = b.toUpperCase();
      
      const aFoodIdx = foodPriority.indexOf(aUpper);
      const bFoodIdx = foodPriority.indexOf(bUpper);
      
      const aBevIdx = beveragePriority.indexOf(aUpper);
      const bBevIdx = beveragePriority.indexOf(bUpper);
      
      if (aFoodIdx !== -1 && bFoodIdx !== -1) return aFoodIdx - bFoodIdx;
      if (aFoodIdx !== -1) return -1;
      if (bFoodIdx !== -1) return 1;
      
      if (aBevIdx !== -1 && bBevIdx !== -1) return aBevIdx - bBevIdx;
      if (aBevIdx !== -1) return -1;
      if (bBevIdx !== -1) return 1;
      
      return a.localeCompare(b);
    });
  }, [filteredMenu, allMenu]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const getCategoryIcon = (cat: string) => {
    const upperCat = cat.toUpperCase();
    const beverageCategories = [
      'JUICE', 'SMOOTHIES', 'DRINKING & MINERAL WATER', 'MILKSHAKE', 'SOFT DRINK', 
      'FRAPPE', 'ARTISAN TEA', 'TEA', 'COFFEE', 'MANUAL BREW', 'CHOCOLATE', 'MOCKTAIL',
      'ICED BLENDED'
    ];
    
    if (beverageCategories.includes(upperCat)) {
      return <GlassWater size={14} className="text-blue-500" />;
    }
    return <Utensils size={14} className="text-orange-600" />;
  };

  const currentRegionLabel = outletName && OUTLETS_JAKARTA.includes(outletName) ? "Jakarta Regional" : "Bandung Regional";

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm`} style={{ backgroundColor: 'var(--app-surface)', borderColor: 'var(--app-primary)' }}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full border shadow-sm`} style={{ backgroundColor: 'var(--app-surface)', borderColor: 'var(--app-primary)' }}>
            <Utensils className="text-gold-500" size={24} style={{ color: 'var(--app-primary)' }} />
          </div>
          <div>
            <h2 className={`text-2xl font-serif font-bold tracking-wide`} style={{ color: 'var(--app-font)' }}>Daftar Menu Resmi</h2>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--app-primary)' }}>Justus Steakhouse - {outletName || 'Digital Menu'} ({currentRegionLabel})</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--app-primary)' }} />
          <input 
            type="text" 
            placeholder="Cari menu atau kategori..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full rounded-full py-3 pl-12 pr-4 focus:outline-none transition-all placeholder-gray-500 font-medium border`}
            style={{ backgroundColor: 'var(--app-bg)', color: 'var(--app-font)', borderColor: 'var(--app-primary)' }}
          />
        </div>
      </div>

      <div className="space-y-12">
        {categories.length === 0 ? (
          <div className={`py-20 text-center border border-dashed rounded-2xl border-gray-700 bg-black/20`}>
            <p className="text-gray-400 italic">Menu tidak ditemukan.</p>
          </div>
        ) : (
          categories.map(cat => {
            const items = filteredMenu.filter(i => i.category === cat);
            return (
              <div key={cat} className="animate-fade-in">
                <div className={`flex items-center gap-4 mb-4 sticky top-20 z-10 backdrop-blur-md py-2 border-b border-gray-800 bg-black/90`}>
                  <h3 className="text-xl font-serif font-bold tracking-wider whitespace-nowrap uppercase" style={{ color: 'var(--app-primary)' }}>{cat}</h3>
                  <div className={`h-[1px] w-full bg-gradient-to-r from-gray-700 to-transparent`}></div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border whitespace-nowrap border-gray-700 text-gray-500`}>{items.length} ITEMS</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((item, idx) => {
                    const isSoldOut = settings?.soldOutItems?.includes(item.name);
                    return (
                      <div 
                        key={idx} 
                        className={`group border rounded-2xl p-4 hover:shadow-xl transition-all duration-300 relative overflow-hidden ${isSoldOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                        style={{ backgroundColor: 'var(--app-surface)', borderColor: isSoldOut ? 'var(--app-danger)' : 'var(--app-primary)' }}
                      >
                        {isSoldOut && (
                          <div className="absolute top-2 right-2 z-20">
                             <span className="bg-red-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg"><Ban size={10}/> SOLD OUT</span>
                          </div>
                        )}
                        <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full transition-all duration-300" style={{ backgroundColor: 'var(--app-primary)' }}></div>
                        <div className="flex flex-col h-full justify-between gap-3">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className={`font-bold text-sm leading-snug uppercase tracking-tight group-hover:opacity-80 transition-opacity`} style={{ color: 'var(--app-font)' }}>{item.name}</h4>
                            <div className="flex gap-1 shrink-0">
                              {item.price >= 500000 && <Star className="text-gold-500" size={14} />}
                              {getCategoryIcon(item.category)}
                            </div>
                          </div>
                          <div className={`flex items-end justify-between border-t pt-2 border-gray-800`}>
                            <span className="text-[10px] text-gray-500 uppercase tracking-tighter">{item.category}</span>
                            <div className="flex items-center gap-1.5 pointer-events-auto z-30">
                              <span className="font-mono font-bold text-sm" style={{ color: 'var(--app-primary)' }}>{formatCurrency(item.price)}</span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingItem(item);
                                  setEditedPrice(item.price.toString());
                                }}
                                className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-gold-500 transition-all cursor-pointer"
                                title="Edit Harga"
                              >
                                <Pencil size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Price Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
          <div 
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl relative animate-scale-up" 
            style={{ backgroundColor: 'var(--app-surface)', borderColor: 'var(--app-primary)' }}
          >
            <button 
              onClick={() => setEditingItem(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-serif font-bold mb-1" style={{ color: 'var(--app-font)' }}>
              Edit Harga Menu
            </h3>
            <p className="text-xs text-gray-500 mb-6 uppercase tracking-wider font-bold">
              Justus Steakhouse - {editingItem.category}
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Nama Menu</label>
                <div className="font-bold text-sm bg-black/30 px-3 py-2 rounded-lg border border-gray-800" style={{ color: 'var(--app-font)' }}>
                  {editingItem.name}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Harga Default ({currentRegionLabel})</label>
                <div className="font-mono text-xs bg-black/30 px-3 py-2 rounded-lg text-gray-500 border border-gray-800">
                  {formatCurrency(
                    ((outletName && OUTLETS_JAKARTA.includes(outletName) ? MENU_DATA_JAKARTA : MENU_DATA_BANDUNG).find(m => m.name === editingItem.name)?.price || editingItem.price)
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Harga Baru (IDR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">Rp</span>
                  <input
                    type="number"
                    value={editedPrice}
                    onChange={(e) => setEditedPrice(e.target.value)}
                    className="w-full bg-black/40 border rounded-xl py-3 pl-10 pr-4 text-sm font-mono focus:outline-none transition-all"
                    style={{ borderColor: 'var(--app-primary)', color: 'var(--app-font)' }}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end items-center">
              {settings?.menuPriceOverrides && settings.menuPriceOverrides[editingItem.name] !== undefined && (
                <button
                  onClick={() => {
                    const updatedOverrides = { ...(settings.menuPriceOverrides || {}) };
                    delete updatedOverrides[editingItem.name];
                    onUpdateSettings({
                      ...settings,
                      menuPriceOverrides: updatedOverrides
                    });
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-red-900 bg-red-950/20 text-red-400 hover:bg-red-950/40 transition-all flex items-center gap-1.5"
                >
                  <Undo2 size={13} /> Reset ke Default
                </button>
              )}
              
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-800 hover:bg-white/5 text-gray-400 transition-all"
              >
                Batal
              </button>
              
              <button
                onClick={() => {
                  const priceNum = parseInt(editedPrice) || 0;
                  const updatedOverrides = { ...(settings?.menuPriceOverrides || {}) };
                  updatedOverrides[editingItem.name] = priceNum;
                  onUpdateSettings({
                    ...settings,
                    menuPriceOverrides: updatedOverrides
                  });
                  setEditingItem(null);
                }}
                className="px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95"
                style={{ backgroundColor: 'var(--app-primary)', color: '#000000' }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuList;