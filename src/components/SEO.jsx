import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ 
  title, 
  description, 
  name = "AirdropSailor", 
  type = "website",
  noindex = false 
}) {
  return (
    <Helmet>
      {/* Standard SEO */}
      <title>{title} | {name}</title>
      <meta name="description" content={description} />
      
      {/* Facebook & Discord Previews */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      
      {/* Twitter / X Previews */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {/* Keeps Google away from Admin & Profile pages */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}