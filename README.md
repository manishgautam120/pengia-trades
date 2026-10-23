# Pengia Trades website

React + Vite. Country picker sets language and currency; currency can also be changed on its own. Live rates come from open.er-api.com (cached 12h) with built-in fallback rates.

## Run
    npm install
    npm run dev        # local
    npm run build      # outputs dist/

## Edit
- `src/data.js`: countries, currencies, indicative `priceUsdPerKg`, products, all translations.
- Add a language: add it to `LANGS`, `I18N`, and a country in `COUNTRIES`.

## Deploy (GitHub -> S3 -> CloudFront)
1. Create a private S3 bucket. Create a CloudFront distribution with that bucket as origin using Origin Access Control, default root object `index.html`.
2. Create an IAM role for GitHub OIDC with `s3:PutObject/DeleteObject/ListBucket` on the bucket and `cloudfront:CreateInvalidation`.
3. Add repo secrets: `AWS_ROLE_ARN`, `AWS_REGION`, `S3_BUCKET`, `CLOUDFRONT_ID`.
4. Push to `main`; the workflow in `.github/workflows/deploy.yml` builds and deploys.

## Notes
- The quote form opens the visitor's email app (static hosting has no backend). For a hosted form, add API Gateway + Lambda + SES.
- Product photos are Unsplash hotlinks; replace with your own images in `public/`.
- Replace the placeholder phone number and prices before launch.
