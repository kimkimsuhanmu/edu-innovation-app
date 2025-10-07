import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View, Platform } from 'react-native';

interface AnimatedSplashProps {
	onFinish?: () => void;
	logoSource?: any; // require(...) for Logo
	appName?: string;
}

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onFinish, logoSource, appName }) => {
	const rotate = useRef(new Animated.Value(0)).current;
	const scale = useRef(new Animated.Value(0.6)).current;
	const opacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.sequence([
			Animated.parallel([
				Animated.timing(rotate, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
				Animated.timing(scale, { toValue: 1.15, duration: 1200, useNativeDriver: true, easing: Easing.out(Easing.back(1.2)) })
			]),
			Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true })
		]).start(() => {
			setTimeout(() => onFinish && onFinish(), 350);
		});
	}, [onFinish, opacity, rotate, scale]);

	const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

	return (
		<View style={styles.container}>
			<Animated.Image
				source={logoSource}
				style={[styles.logo, { transform: [{ rotate: spin }, { scale }], opacity }]} resizeMode="contain"
			/>
			{Platform.OS === 'web' && (
				// 웹은 문서 타이틀로 앱 이름을 보강
				<Image accessibilityLabel={appName} style={{ width: 0, height: 0 }} />
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
	logo: { width: 160, height: 160 }
});

export default AnimatedSplash;

