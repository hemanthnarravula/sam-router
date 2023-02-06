#!/bin/bash

# mfa_serial='AWS ACC MFA ARN HERE'

# echo -n "Enter your mfa token: "
# read mfa_token

temp_role=$(aws sts assume-role --role-arn arn:aws:iam::236731556556:role/TDCDevAdmin --role-session-name CLI-SESSION --profile ttc )



# mfa_serial='arn:aws:iam::469068014527:mfa/hemanth.narravula@ttc.com	'

# echo -n "Enter your mfa token: "
# read mfa_token

# temp_role=$(aws sts get-session-token --serial-number $mfa_serial --token-code $mfa_token --profile ttc)

export AWS_ACCESS_KEY_ID=$(echo $temp_role | jq -r .Credentials.AccessKeyId)
export AWS_SECRET_ACCESS_KEY=$(echo $temp_role | jq -r .Credentials.SecretAccessKey)
export AWS_SESSION_TOKEN=$(echo $temp_role | jq -r .Credentials.SessionToken)

aws --profile default configure set aws_access_key_id $AWS_ACCESS_KEY_ID
aws --profile default configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
aws --profile default configure set aws_session_token $AWS_SESSION_TOKEN

echo " "
echo "=================== NEW SECURITY CREDENTIALS ========================"
echo "ACCESS KEY ID: $AWS_ACCESS_KEY_ID"
echo "SESSION TOKEN: $AWS_SESSION_TOKEN"
echo "====================================================================="