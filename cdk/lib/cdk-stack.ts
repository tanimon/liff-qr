import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';

// Reference: https://dev.classmethod.jp/articles/s3-cloudfront-cdk-content-distribution/
export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Bucket
    const myBucket = new s3.Bucket(this, 'my-bucket');

    // Create OriginAccessIdentity
    const oai = new cloudfront.OriginAccessIdentity(this, 'my-oai');

    // Create Policy and attach to my-bucket
    const myBucketPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      principals: [
        new iam.CanonicalUserPrincipal(
          oai.cloudFrontOriginAccessIdentityS3CanonicalUserId
        ),
      ],
      resources: [myBucket.bucketArn + '/*'],
    });
    myBucket.addToResourcePolicy(myBucketPolicy);

    // Create CloudFront WebDistribution
    new cloudfront.CloudFrontWebDistribution(this, 'WebsiteDistribution', {
      viewerCertificate: {
        aliases: [],
        props: {
          cloudFrontDefaultCertificate: true,
        },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: myBucket,
            originAccessIdentity: oai,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              minTtl: cdk.Duration.seconds(0),
              maxTtl: cdk.Duration.days(365),
              defaultTtl: cdk.Duration.days(1),
              pathPattern: 'my-contents/*',
            },
          ],
        },
      ],
      errorConfigurations: [
        {
          errorCode: 403,
          responsePagePath: '/index.html',
          responseCode: 200,
          errorCachingMinTtl: 0,
        },
        {
          errorCode: 404,
          responsePagePath: '/index.html',
          responseCode: 200,
          errorCachingMinTtl: 0,
        },
      ],
    });
  }
}
