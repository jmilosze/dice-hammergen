if [ "$1" = "functions" ]
then
  firebase deploy --only functions
elif [ "$1" = "hosting" ]
then
  firebase deploy --only hosting
elif [ "$1" = "all" ]
then
  firebase deploy
fi