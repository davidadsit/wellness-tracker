.PHONY: all ios android install pods test prep clean

all: ios android

install:
	npm install

pods: install
	cd ios && bundle install && bundle exec pod install

ios: pods
	npx react-native run-ios

android: install
	npx react-native run-android

prep:
	npm run lint:fix
	npm run format
	npm run test:unit
	npm run test:integration
	npm run test:acceptance

test:
	npx jest --maxWorkers=1

clean:
	rm -rf node_modules ios/Pods ios/build android/app/build
