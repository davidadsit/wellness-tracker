import React from 'react';
import {View} from 'react-native';

const DateTimePicker = (props: any) => {
  const {testID = 'reminder-time-picker', onChange, ...rest} = props;
  return <View testID={testID} onChange={onChange} {...rest} />;
};

export default DateTimePicker;
