const site = 'https://www.atelyemimmimarlik.com/';
const sampleProjects = [
  ['AMM-00002', 'AT Evi ve Eki', '1986, 2013', 'Konut', 'Çukurova, Adana', '', 380, 'at', '2015/11/tan02.jpg'],
  ['AMM-00003', 'Ziraat Bankası Röleve Restorasyonu', '1986', 'Ticari', 'Seyhan, Adana', 'Ziraat Bankası', null, 'ziraat-bankasi-roleve-restorasyonu', '2015/11/ziraaat-görünüş-1.jpg'],
  ['AMM-00004', 'Turkuaz Evleri', '', 'Konut', 'Yenişehir, Mersin', '', null, 'turkuaz', '2015/11/tu_02.jpg'],
  ['AMM-00005', 'Akademi Konsept', '2015', 'Konut', 'Mersin', '', null, 'akademi-konsept', '2016/01/eaka_2.jpg'],
  ['AMM-00006', 'Yıldızkent Konutları', '', 'Konut', 'Tarsus, Mersin', '', null, 'yildizkent-konutlari', '2016/01/yild_06.jpg'],
  ['AMM-00007', 'Yağlıcı Plaza', '', 'Ticari', 'Seyhan, Adana', '', null, 'yaglici-plaza', '2015/11/Yağlıcı-plaza-5.jpg'],
].map(([id, title, years, type, location, client, area, slug, photo]) => ({
  id, title, years, type, location, client, area,
  city: location.split(', ').at(-1),
  url: site + 'proje/' + slug + '/',
  image: site + 'wp-content/uploads/' + encodeURI(photo),
}));
