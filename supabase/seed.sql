insert into public.menu_items (name,description,price,category,image_url,is_vegetarian) values
('Paneer Tikka','Smoky tandoor-grilled cottage cheese with peppers and mint chutney.',289,'Starters','https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=900&q=80',true),
('Crispy Corn Chaat','Golden corn tossed with chaat masala, lime, coriander and a little crunch.',189,'Starters','https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80',true),
('Hara Bhara Kebab','Spinach and garden pea patties with warm spices and green chutney.',219,'Starters','https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80',true),
('Chicken Tikka','Tender chicken marinated overnight and charred in our clay oven.',329,'Starters','https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=900&q=80',false),
('Butter Paneer Masala','Paneer in a silky tomato, butter and cashew gravy. A house favourite.',329,'Mains','https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80',true),
('Dal Makhani','Slow-cooked black lentils finished with cream, butter and gentle spices.',279,'Mains','https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80',true),
('Palak Paneer','Soft paneer cubes in a fresh, creamy spinach gravy.',299,'Mains','https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80',true),
('Chicken Tikka Masala','Chargrilled chicken in a richly spiced, creamy tomato sauce.',369,'Mains','https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80',false),
('Hyderabadi Chicken Biryani','Aromatic basmati dum-cooked with chicken, saffron and fried onions.',359,'Rice & Biryani','https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=80',false),
('Vegetable Dum Biryani','Fragrant basmati layered with seasonal vegetables and whole spices.',299,'Rice & Biryani','https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=80',true),
('Jeera Rice','Fluffy basmati tempered with cumin and a touch of ghee.',159,'Rice & Biryani','https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=900&q=80',true),
('Butter Naan','Soft tandoor-baked leavened bread brushed with butter.',59,'Breads','https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=900&q=80',true),
('Garlic Naan','Tandoor-baked naan topped with fresh garlic and coriander.',79,'Breads','https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=900&q=80',true),
('Gulab Jamun','Soft milk dumplings soaked in fragrant cardamom and rose syrup.',129,'Desserts','https://images.unsplash.com/photo-1666190094762-3e31a2c4b64b?auto=format&fit=crop&w=900&q=80',true),
('Mango Lassi','Cool yoghurt blended with sweet mango and a hint of cardamom.',119,'Drinks','https://images.unsplash.com/photo-1527761939622-911453e9c006?auto=format&fit=crop&w=900&q=80',true)
on conflict (name) do nothing;
