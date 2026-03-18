.PHONY: all ios android install pods test clean

all: ios android

install:
	npm install

pods: install
	cd ios && bundle install && bundle exec pod install

ios: pods
	npx react-native run-ios

android: install
	npx react-native run-android

test:
	npx jest --maxWorkers=1

clean:
	rm -rf node_modules ios/Pods ios/build android/app/build
