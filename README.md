## Visualize your AWS Infrastructure with Amazon Neptune and AWS Config

This repository contains the resources referred in the blog post **Visualize your AWS Infrastructure with Amazon Neptune and AWS Config.** Follow the steps mentioned in the blog to deploy the infrastructure to visualize the AWS resources and their relationships using Amazon Neptune and AWS Config. 

Amazon Neptune is a fast, reliable, fully managed graph database service available from AWS. With Amazon Neptune you can use open source and popular graph query languages such as Apache TinkerPop Gremlin for property graph databases or SPARQL for W3C RDF model graph databases. 

AWS Config is a service that enables you to assess, audit, and evaluate the configurations of your AWS resources. Config continuously monitors and records your AWS resource configurations and allows you to automate the evaluation of recorded configurations against desired configurations. 

## Architecture

<img width="512" alt="image" src="https://user-images.githubusercontent.com/1254538/119129765-a50d1e00-ba37-11eb-98e4-298cf4a8d845.png">

The workflow includes the following steps:

1.	Enable AWS Config in your AWS account and set up an Amazon Simple Storage Service (Amazon S3) bucket where all the config logs are stored. 
2.	Amazon S3 Batch Operations uses AWS Lambda on an existing S3 bucket to populate the Neptune graph with the existing AWS Config inventory and build out the relationship map. AWS Lambda function is also triggered when a new AWS Config file is delivered to an S3 bucket and updates the Neptune database with all the changes.
3.	User authenticates with Amazon Cognito and makes a call to an Amazon API Gateway endpoint
4.	The static website calls an AWS Lambda function which is accessed through the proxy and exposed to the internet using Amazon API Gateway.
5.	AWS Lambda function is used to query the graph in Amazon Neptune and passes the data back to the app to render the visualization.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

