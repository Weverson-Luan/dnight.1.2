import React, { useState, useEffect } from "react";
import { Text, View, Alert } from "react-native";
import { FormControl, Stack, Select } from "native-base";

//google-firebase
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';

import AsyncStorage from "@react-native-async-storage/async-storage";

//slider react-native-community-slider
import Slider from "@react-native-community/slider";

//masked
import MaskInput, { Masks } from "react-native-mask-input";

//select-image
import * as ImagePicker from 'expo-image-picker';

//icons
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

//Spinner
import Spinner from "react-native-loading-spinner-overlay";

//validation
import validator from "validator";

//commons
import { Styles } from "../../common/styles";

// i18n
import i18n from "../../i18n";

//config
import { PickerImage } from "../../config/SelectImage";

//components
import { InputError } from "../../components/Input/InputError";
import { ProfilePicture } from "../../components/ProfilePicture";
import { PrimaryButton } from "../../components/PrimaryButton";

//utils
import { HelperFunctions } from "../../utils/HelperFuntions";

//styles-components
import {
  Container,
  Screen,
  formControl,
  ContentImage,
  ContentForm,
  inputError,
  maskInput,
  stack,
  stackDistanceFlexRow,
  stackDistance,
  contentForm,
  stackInputMask,
  stackBirthDate,
} from "./style";
import { HeaderUpdate } from "../../components/HeaderUpdate";

export function Register({ navigation,route }) {
const {updateMode} = route.params
  const [ username, setUsername ] = useState("");
  const [ email, setEmail ] = useState("");
  const [ phone, setPhone ] = useState("");
  const [ birthDate, setBirthDate ] = useState("");
  const [ gender, setGender ] = useState("");
  const [ password, setPassword ] = useState("");
  const [eventDistance, setEventDistance] = useState(25);

  const [dataLogin, setDataLogin] = useState({
    username: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: "",
    password: "",
    eventDistance: 25,
    spinner: false,
    updateMode: false,
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    picture: "",
    username: "",
    phone: "",
    birthDate: "",
    message: "",
  });

  const [picture, setPicture] = useState("");
  const [pictureUpdate, setPictureUpdate] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, requestPermission] = ImagePicker.useMediaLibraryPermissions();
  const [isLoading, setIsLoading] = useState(false)
  /**
   * FAZER  UPLOAD DE IMAGE DENTRO DO Google Cloud Storage bucket DO FIREBASE.
   * @param {*} picture 
   * @param {*} name 
   * @param {*} firebasePath 
   * @returns 
   */
  const uploadImage = async (picture, name, firebasePath) => {
    const imageRef = storage().ref(`${firebasePath}/${name}`)
    if(pictureUpdate){
      await imageRef.putFile(pictureUpdate, { contentType: 'image/jpg'}).catch((error) => { Alert.alert("[ERROR] - " + error)  })
    }

    return await imageRef.getDownloadURL();
  };

 const getUserData = async () => {
  if(username === ""){
    return setErrors({ username: i18n.t("errors.empty.username") });
  }
  if(email === ""){
    return setErrors({ email: i18n.t("errors.empty.email") });
  }
  if(!validator.isEmail(email)){
    return setErrors({ email: i18n.t("errors.invalid.email") });
  }
  if(phone === ""){
    return setErrors({ phone: i18n.t("errors.empty.phone") });
  }
  if(password === ""){
    return setErrors({ password: i18n.t("errors.empty.password") });
  }
  if(picture === ""){
    return setErrors({ picture: i18n.t("errors.empty.picture") });
  }
  setIsLoading(true)
  const userLocation = await AsyncStorage.getItem("@positionActual");
      const useLocationTransform  = JSON.parse(userLocation);
     
  auth().createUserWithEmailAndPassword(email, password).then((userCredential)=> {
    let filename =  'IMG_' + HelperFunctions('all') + '_DNIGHT_' + Math.floor(Math.random() * (9999 - 1000)) + 1000;
    const firebasePath = "profilePictures";
    uploadImage(picture, filename, firebasePath)
    .then((downloadURL)=> {
      database().ref(`users/${userCredential.user.uid}`).set({
        location: {
          lat: useLocationTransform?.coords.latitude,
          lng: useLocationTransform?.coords.latitude,
        },
        picture: downloadURL,
        username,
        email,
        phone,
        birthDate,
        gender,
        password,
        eventDistance,
      }).then((snapshot) => {
        alert("Cadastrado com sucesso !")
        navigation.navigate("Login")
    
      })
      .catch((error)=> {
        setIsLoading(false)
        console.error("error register user", error);
      });
    })
    .catch((error)=> {
      setIsLoading(false)
      console.error("error upload img", error);
    });
  })
  .catch((error)=> {
    Alert.alert("Error cadastrar usuário", "Email de usuário ja esta cadastrado.")
    return setIsLoading(false) 
})
.finally(()=>setIsLoading(false))
    
 };

const updateUser = async () => {
  setIsLoading(true)
    const user_id = await AsyncStorage.getItem(process.env.USER_ID);
    const position = await  AsyncStorage.getItem(process.env.POSITION_ACTUAL);
    const position_Transform = JSON.parse(position);
    
    try {
      if(pictureUpdate){
        let filename =  'IMG_' + HelperFunctions('all') + '_DNIGHT_' + Math.floor(Math.random() * (9999 - 1000)) + 1000;
        const firebasePath = "profilePictures";
        uploadImage(picture, filename, firebasePath)
        .then((imageUpload)=> {
          database()
          .ref(`users/${user_id}`)
          .update({
                  location: {
                    lat: position_Transform.coords.latitude,
                    lng:  position_Transform.coords.longitude,
                  },
                  username,
                  email,
                  phone,
                  birthDate,
                  gender,
                  picture: imageUpload,
                  eventDistance,
              })
              .then((_response)=> {
                setIsLoading(false);
                Alert.alert("Dados atualizado", "Seus dados foram atualizado com sucesso.");
            })
        })
      };

      if(!pictureUpdate){
        database()
        .ref(`users/${user_id}`)
        .update({
                location: {
                  lat: position_Transform.coords.latitude,
                  lng:  position_Transform.coords.longitude,
                },
                username,
                email,
                phone,
                birthDate,
                gender,
                picture: picture,
                eventDistance,
            })
            .then((_responseUserUpdate)=> {
              setIsLoading(false)
              Alert.alert("Dados atualizado", "Seus dados foram atualizado com sucesso.");
        })
        .catch((error)=> {
          Alert.alert("Dados atualizado", "Houve algum problema para atualizar suas informações feche o app e tente novamente.");
        })
      }

    } catch (error) {
      console.log("ERROR ATUALIZAR USUÁRIO", error)
    }   
};

const selectImage = async () => {
      let extensionsOfPermitidae = /(.jpg|.jpeg|.png|.gif)$/i;
      if(status.granted === true){
         PickerImage()
         .then((response)=> {
          setPictureUpdate(response);
          if(!extensionsOfPermitidae.exec(response)){
               return Alert.alert(
              "Tipo de Aquivo inválido!",
              `Apenas imagems com esses tipos de extensão ${extensionsOfPermitidae} são validas.`,
              [
                {
                  text: "Cancel",
                  onPress: () =>  navigation.navigate("Register", {
                    updateMode: updateMode
                  }),
                  style: "cancel"
                },
                { text: "OK", onPress: () => navigation.navigate("Register", {
                  updateMode: updateMode
                })}
              ]
            );
            }
            setPicture(response);
         })
         .catch((error)=> {
            console.error("Error selectImage", error)
         });
      };
};

   useEffect(()=> {
    auth().onAuthStateChanged((user) => {
      if (user) {
        database().ref('users').child(user.uid).on('value', function (snapshot) {
        let  userData = snapshot.val();
        setDataLogin({updateMode})
        setUsername(userData?.username);
        setEmail(userData?.email);
        setPhone(userData?.phone);
        setBirthDate(userData?.birthDate);
        setGender(userData?.gender);
        setPassword(userData?.password);
        setEventDistance(eventDistance);
        setPicture(userData?.picture)
        });
       };
    });
  }, [])


 useEffect(()=> {
  requestPermission();
 }, []);


  return (
    <Container>
      <Screen>
        {
          isLoading && <Spinner visible={true} />
        }
        {
          updateMode &&  <HeaderUpdate />
        }
        <ContentImage>
          {
            picture ?  <ProfilePicture picture={{ uri: picture}}  onPress={() =>{
                setPicture("");
                selectImage();
        
            }}/> 
            : 
            <ProfilePicture picture={{uri: picture}}  onPress={() => selectImage()} />
          }
        
          {errors.picture ? (
            <InputError style={inputError} error={errors.picture} />
          ) : null}
        </ContentImage>

        <FormControl style={formControl}>
          <Stack space={4} w="100%" style={stackInputMask}>
            <Icon name="account" size={24} color={Styles.Color.PLACEHOLDER} />
            <MaskInput
              value={username}
              onChangeText={username => setUsername(username)}
              style={maskInput}
              placeholder={`${i18n.t("placeholders.name")}*`}
            />
          </Stack>
          {errors.username ? <InputError error={errors.username} /> : null}

          <Stack space={4} w="100%" style={stackInputMask}>
            <Icon name="email" size={24} color={Styles.Color.PLACEHOLDER} />
            <MaskInput
              value={email}
              onChangeText={email => setEmail(email)}
              style={maskInput}
              placeholder={`${i18n.t("placeholders.email")}*`}
            />
          </Stack>
          {errors.email ? <InputError error={errors.email} /> : null}

          <Stack space={4} w="100%" style={stackInputMask}>
            <Icon name="phone" size={24} color={Styles.Color.PLACEHOLDER} />
            <MaskInput
              value={phone}
              mask={Masks.BRL_PHONE}
              onChangeText={unmasked => setPhone(unmasked)}
              style={maskInput}
            />
          </Stack>
          {errors.phone ? <InputError error={errors.phone} /> : null}
          <Stack space={4} w="100%" style={stackInputMask}>
            <Icon name="calendar" size={24} color={Styles.Color.PLACEHOLDER} />
            <MaskInput
              value={birthDate}
              mask={Masks.DATE_DDMMYYYY}
              onChangeText={unmasked => setBirthDate(unmasked)}
              style={maskInput}
            />
          </Stack>
          {errors.birthDate ? <InputError error={errors.birthDate} /> : null}
          <Stack space={4} w="100%" style={stackBirthDate}>
            <Select
              borderColor={"transparent"}
              variant="unstyled"
              color={Styles.Color.GREY_DARK}
              mode="dialog"
              placeholder="Gênero*"
              selectedValue={gender}
              onValueChange={gender => setGender(gender)}
              InputLeftElement={
                <Icon
                  name="gender-male-female"
                  size={24}
                  color={Styles.Color.PLACEHOLDER}
                />
              }
            >
              <Select.Item label="Feminino" value="F" />
              <Select.Item label="Masculino" value="M" />
              <Select.Item label="Outro" value="O" />
              <Select.Item label="Indefinido" value="U" />
            </Select>
          </Stack>
          {errors.gender ? <InputError error={errors.gender} /> : null}
          {!dataLogin.updateMode ? (
            <Stack space={4} w="100%" style={stackInputMask}>
              <Icon name="lock" size={24} color={Styles.Color.PLACEHOLDER} />
              <MaskInput
                value={password}
                onChangeText={password => setPassword(password)}
                secureTextEntry={!showPassword}
                style={maskInput}
                placeholder={`${i18n.t("placeholders.password")}*`}
              />
              <Icon
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                type="MaterialCommunityIcons"
                size={24}
                style={{ color: Styles.Color.PLACEHOLDER, marginLeft: "auto" }}
                onPress={() => setShowPassword(!showPassword)}
              />
            </Stack>
          ) : null}
          {errors.password ? <InputError error={errors.password} /> : null}
          <Stack space={4} w="100%" style={stack}>
            <Stack space={4} w="100%" u style={stackDistance}>
              <Text style={{ color: Styles.Color.PLACEHOLDER }}>
                Distância de eventos
              </Text>
            </Stack>
            <Stack space={4} w="100%" style={stackDistanceFlexRow}>
              <Icon
                name="google-maps"
                size={24}
                color={Styles.Color.PLACEHOLDER}
              />
              <Slider
                style={{ flex: 1, height: 50 }}
                value={eventDistance}
                onValueChange={eventDistance => setEventDistance( Math.floor(eventDistance))}
                minimumValue={0}
                maximumValue={100}
                minimumTrackTintColor={Styles.Color.PRIMARY}
                maximumTrackTintColor={Styles.Color.PRIMARY_DARK}
                thumbTintColor={Styles.Color.PRIMARY_DARK}
              ></Slider>

              <Text style={{ width: 60, color: Styles.Color.PLACEHOLDER }}>
                {/*utilizando interrogação(?) caso  o valor do obejto seja nulo para ele ignorar e seguir o fluxo mesmo se estiver nulo.*/}
                {eventDistance?.toFixed(0)} KM
              </Text>
            </Stack>
          </Stack>

          <ContentForm style={contentForm}>
            {
              updateMode ? 
              <PrimaryButton
              // aqui a validacao do firabase
              onPress={updateUser}
              title={i18n.t("buttons.update").toUpperCase()}
              color={"error"}
              size={"lg"}
              variant={"solid"}
              radius={100}
              height={45}
            />
              :
              <PrimaryButton
              // aqui a validacao do firabase
              onPress={getUserData}
              title={i18n.t("buttons.signUp").toUpperCase()}
              color={"error"}
              size={"lg"}
              variant={"solid"}
              radius={100}
              height={45}
            />
            }

            {dataLogin.updateMode ? (
              <View style={{ marginTop: 10 }}>
                <PrimaryButton
                  title={i18n.t("buttons.recoverPassword").toUpperCase()}
                  onPress={() => console.log("resete senha")}
                  color={"error"}
                  size={"lg"}
                  variant={"solid"}
                  radius={100}
                  height={45}
                />
              </View>
            ) : null}
          </ContentForm>
        </FormControl>
      </Screen>
    </Container>
  );
}
