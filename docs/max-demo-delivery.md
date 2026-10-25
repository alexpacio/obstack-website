# Self-hosted Max evaluation delivery

The self-hosted offering is at `/self-hosted`. `/download` offers a Max evaluation deployed with the Obstack Helm chart and a 30-day license. Docker image URLs are not part of the website contract; the chart will define the image repositories and versions when supplied.

## Before the chart is published

No chart URL or artifact has been supplied. The website therefore displays “Request Helm chart + 30-day license”, using the existing protected email flow. The page states that the public chart download is coming soon. There is no fabricated archive, registry or Helm install command.

The request includes the company, license contact, Kubernetes environment, Max edition, 30-day license duration and intended paid activation. This static website does not issue or sign licenses. Delivery and license issuance remain the publisher's responsibility.

## Enable direct chart download

Set `PUBLIC_MAX_DEMO_CHART_URL` to the public HTTPS URL of a versioned Helm chart package and rebuild. For GitHub Pages, set the repository Actions variable with the same name; the deployment workflow passes it to the build. An example variable is documented in `.env.example`.

Once configured, the page shows a direct “Download Max Helm chart” link and a separate request for the 30-day license. Do not put customer license files, signing keys, access tokens or authenticated URLs in this variable. The license request remains separate because the evaluation license is issued for the customer, with the 30-day window starting at issuance.

The supplied chart release must include versioned dependencies, image references, configuration and license-installation instructions. Kubernetes compatibility, evaluation sizing and license enforcement belong to the chart and licensed applications; they cannot be tested before the artifact exists. Existing EagleSRE preview status remains explicit on the site.

## Paid activation

The demo page offers self-hosted Go, Pro and Max activation links. They carry `trial=max`, the selected plan, `deploy=self-hosted` and monthly billing into checkout. The checkout requires the evaluation license/customer ID and includes it in the invoice request. The request is labelled as activation of the existing Max evaluation.

After payment, the publisher supplies the paid license and activation instructions for that installation. Preserve the installation and data; apply the selected entitlements and adjust resources if required. Lower tiers do not inherit Max support or product entitlements. Starter is cloud-only and cannot be selected for in-place self-hosted activation. The trial does not automatically create a subscription, invoice or charge, and it does not include a production SLA or paid Max support commitment.

The `fromTrial` flag survives quote/configurator round trips only for eligible self-hosted plans. Normalisation clears it for cloud plans. The website prepares an invoice request; it does not claim to activate licenses automatically.
