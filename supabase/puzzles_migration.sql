-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> paste -> Run)

create table if not exists puzzles (
  id serial primary key,
  day integer not null unique,
  theme text not null,
  pool jsonb not null,
  words jsonb not null
);

alter table puzzles enable row level security;

create policy "Public can read puzzles"
  on puzzles for select
  using (true);

insert into puzzles (day, theme, pool, words) values
(1, 'hearth', '["BER","CAR","COT","DRA","GON","TIM","TON","WA"]'::jsonb, '[{"a":"COT","b":"TON","w":"COTTON","key":false},{"a":"CAR","b":"TON","w":"CARTON","key":false},{"a":"DRA","b":"GON","w":"DRAGON","key":false},{"a":"TIM","b":"BER","w":"TIMBER","key":false},{"a":"WA","b":"GON","w":"WAGON","key":true}]'::jsonb),
(2, 'morning', '["AST","BAT","BUT","COF","FEE","TER","TO","WA"]'::jsonb, '[{"a":"COF","b":"FEE","w":"COFFEE","key":false},{"a":"BUT","b":"TER","w":"BUTTER","key":false},{"a":"BAT","b":"TER","w":"BATTER","key":false},{"a":"WA","b":"TER","w":"WATER","key":true},{"a":"TO","b":"AST","w":"TOAST","key":false}]'::jsonb),
(3, 'cozy', '["BER","CAN","DLE","EM","LOW","OPY","PIL","TIM"]'::jsonb, '[{"a":"CAN","b":"DLE","w":"CANDLE","key":true},{"a":"CAN","b":"OPY","w":"CANOPY","key":false},{"a":"EM","b":"BER","w":"EMBER","key":false},{"a":"TIM","b":"BER","w":"TIMBER","key":false},{"a":"PIL","b":"LOW","w":"PILLOW","key":false}]'::jsonb),
(4, 'garden', '["DEN","ER","FLOW","GAR","GOL","MER","SUM","TOW"]'::jsonb, '[{"a":"GAR","b":"DEN","w":"GARDEN","key":true},{"a":"GOL","b":"DEN","w":"GOLDEN","key":false},{"a":"FLOW","b":"ER","w":"FLOWER","key":false},{"a":"TOW","b":"ER","w":"TOWER","key":false},{"a":"SUM","b":"MER","w":"SUMMER","key":false}]'::jsonb),
(5, 'kitchen', '["CAKE","HOT","KET","PAN","POT","TEA","TLE","TRY"]'::jsonb, '[{"a":"PAN","b":"TRY","w":"PANTRY","key":false},{"a":"PAN","b":"CAKE","w":"PANCAKE","key":false},{"a":"TEA","b":"POT","w":"TEAPOT","key":true},{"a":"HOT","b":"POT","w":"HOTPOT","key":false},{"a":"KET","b":"TLE","w":"KETTLE","key":false}]'::jsonb),
(6, 'winter', '["FIRE","MAN","MIT","SHEL","SNOW","TEN","TER","WIN"]'::jsonb, '[{"a":"WIN","b":"TER","w":"WINTER","key":true},{"a":"SHEL","b":"TER","w":"SHELTER","key":false},{"a":"SNOW","b":"MAN","w":"SNOWMAN","key":false},{"a":"FIRE","b":"MAN","w":"FIREMAN","key":false},{"a":"MIT","b":"TEN","w":"MITTEN","key":false}]'::jsonb),
(7, 'ocean', '["BOR","FISH","HAR","LOR","PAR","SAI","SHELL","STAR"]'::jsonb, '[{"a":"SAI","b":"LOR","w":"SAILOR","key":false},{"a":"PAR","b":"LOR","w":"PARLOR","key":false},{"a":"SHELL","b":"FISH","w":"SHELLFISH","key":false},{"a":"STAR","b":"FISH","w":"STARFISH","key":true},{"a":"HAR","b":"BOR","w":"HARBOR","key":false}]'::jsonb),
(8, 'travel', '["AGE","AIR","BACK","KET","PACK","PASS","PORT","TIC"]'::jsonb, '[{"a":"AIR","b":"PORT","w":"AIRPORT","key":false},{"a":"PASS","b":"PORT","w":"PASSPORT","key":false},{"a":"BACK","b":"PACK","w":"BACKPACK","key":false},{"a":"PACK","b":"AGE","w":"PACKAGE","key":false},{"a":"TIC","b":"KET","w":"TICKET","key":true}]'::jsonb),
(9, 'music', '["CAR","DRUM","GUI","MER","PET","PO","TAR","TEM","TRUM"]'::jsonb, '[{"a":"DRUM","b":"MER","w":"DRUMMER","key":false},{"a":"TRUM","b":"PET","w":"TRUMPET","key":false},{"a":"GUI","b":"TAR","w":"GUITAR","key":false},{"a":"CAR","b":"PET","w":"CARPET","key":false},{"a":"TEM","b":"PO","w":"TEMPO","key":true}]'::jsonb),
(10, 'woodland', '["BIT","CHEST","ET","HORN","NUT","RAB","ROCK","WAL"]'::jsonb, '[{"a":"WAL","b":"NUT","w":"WALNUT","key":true},{"a":"CHEST","b":"NUT","w":"CHESTNUT","key":false},{"a":"RAB","b":"BIT","w":"RABBIT","key":false},{"a":"HORN","b":"ET","w":"HORNET","key":false},{"a":"ROCK","b":"ET","w":"ROCKET","key":false}]'::jsonb),
(11, 'bakery', '["CAKE","COOK","CUP","IE","PAN","PAS","TA","TRY"]'::jsonb, '[{"a":"CUP","b":"CAKE","w":"CUPCAKE","key":true},{"a":"PAN","b":"CAKE","w":"PANCAKE","key":false},{"a":"PAS","b":"TRY","w":"PASTRY","key":false},{"a":"PAS","b":"TA","w":"PASTA","key":false},{"a":"COOK","b":"IE","w":"COOKIE","key":false}]'::jsonb),
(12, 'campfire', '["CAMP","FIRE","LIGHT","MAR","MOON","SH","STAR","WOOD"]'::jsonb, '[{"a":"CAMP","b":"FIRE","w":"CAMPFIRE","key":true},{"a":"FIRE","b":"WOOD","w":"FIREWOOD","key":false},{"a":"MOON","b":"LIGHT","w":"MOONLIGHT","key":false},{"a":"STAR","b":"LIGHT","w":"STARLIGHT","key":false},{"a":"MAR","b":"SH","w":"MARSH","key":false}]'::jsonb),
(13, 'storybook', '["BOOK","CAS","DOM","FREE","KING","NOTE","TEXT","TLE"]'::jsonb, '[{"a":"NOTE","b":"BOOK","w":"NOTEBOOK","key":false},{"a":"TEXT","b":"BOOK","w":"TEXTBOOK","key":false},{"a":"KING","b":"DOM","w":"KINGDOM","key":false},{"a":"FREE","b":"DOM","w":"FREEDOM","key":false},{"a":"CAS","b":"TLE","w":"CASTLE","key":true}]'::jsonb),
(14, 'weather', '["BOW","DER","DROP","RAIN","RISE","SET","SUN","THUN"]'::jsonb, '[{"a":"RAIN","b":"BOW","w":"RAINBOW","key":true},{"a":"RAIN","b":"DROP","w":"RAINDROP","key":false},{"a":"SUN","b":"RISE","w":"SUNRISE","key":false},{"a":"SUN","b":"SET","w":"SUNSET","key":false},{"a":"THUN","b":"DER","w":"THUNDER","key":false}]'::jsonb)
on conflict (day) do nothing;
