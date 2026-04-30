# Feeds do catálogo Rumo à Nova Jerusalém

Este repositório contém os feeds permanentes para importar os 10 livros da vitrine Rumo à Nova Jerusalém em plataformas de redes sociais e anúncios.

## URLs permanentes

### Meta / Instagram

Use este CSV no Meta Commerce Manager:

https://raw.githubusercontent.com/Primeiromilhao/blogger_Estudos/main/catalogo_meta_instagram.csv

Campos principais: `id`, `title`, `description`, `availability`, `condition`, `price`, `link`, `image_link`, `brand`, `google_product_category`, `product_type`, `item_group_id`, `custom_label_0`.

### TikTok Catalog

Use este CSV no TikTok Ads Manager / Catalog Manager:

https://raw.githubusercontent.com/Primeiromilhao/blogger_Estudos/main/catalogo_tiktok.csv

Campos principais: `sku_id`, `title`, `description`, `availability`, `condition`, `price`, `link`, `image_link`, `brand`, `google_product_category`, `product_type`, `item_group_id`.

### Master

Feed mestre com todos os campos:

https://raw.githubusercontent.com/Primeiromilhao/blogger_Estudos/main/catalogo_nova_jerusalem_master.csv

### JSON para automações

https://raw.githubusercontent.com/Primeiromilhao/blogger_Estudos/main/catalogo_nova_jerusalem.json

## Configuração recomendada

- Moeda: EUR
- País/mercado Meta: Brasil se a Meta bloquear Portugal para Lojas
- Marca: Rumo à Nova Jerusalém
- Categoria Google: 784, Media > Books
- Disponibilidade: in stock
- Condição: new

## Observações

O preço usado é `9.90 EUR`, conforme a vitrine exibe “A partir de 9,90€”. Confirme manualmente se este é o preço final antes de campanhas pagas. Alguns links apontam para Amazon/afiliado; se a plataforma exigir domínio próprio, substitua os links por páginas do site da vitrine.
