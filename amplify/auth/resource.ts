import { defineAuth, secret } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: false,
    externalProviders: {
      oidc: [
        {
          name: 'MicrosoftEntraID',
          clientId: secret('AZURE_CLIENT_ID'),
          clientSecret: secret('AZURE_CLIENT_SECRET'),
          issuerUrl: secret('AZURE_ISSUER_URL'),
          scopes: ['openid', 'email', 'profile'],
          attributeMapping: {
            email: 'email',
            preferredUsername: 'preferred_username',
            fullname: 'name',
          },
        },
      ],
      callbackUrls: [
        'http://localhost:5173/',
        'http://localhost:5173/callback',
      ],
      logoutUrls: [
        'http://localhost:5173/',
      ],
    },
  },
});
