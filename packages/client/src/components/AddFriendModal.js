import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import socket from "../Socket.js";

function AddFriendModal(props) {
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    return (
        <>
            <button onClick={() => {
                setShowModal(true);
                setError('');
            }}>
                Add a Friend
            </button>

            {showModal && (
                <div style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: "white",
                    padding: "20px",
                    border: "1px solid black"
                }}>
                    <div style={{
                        position: "absolute",
                        top: "0",
                        right: "0",
                        cursor: "pointer"
                    }} onClick={() => setShowModal(false)}>
                        X
                    </div>
                    <Formik
                        initialValues={{ username: "" }}
                        onSubmit={values => {
                            console.log(socket);
                            socket.emit("add_friend", values.username, ({errorMsg, done}) => {
                                if(done) {
                                    console.log('done');
                                    setShowModal(false);
                                    props.setFriends([...props.friends, {username: values.username}]);
                                    return;
                                } else {
                                    console.log('not done');
                                    setError(errorMsg);
                                    return;
                                }
                            });
                        }}
                    >
                        {({ handleSubmit, handleChange, values  }) => (
                            <Form onSubmit={handleSubmit}>
                                <h4 style={{color:'red'}}>{error}</h4>
                                <label>Add a friend</label>
                                <Field
                                    type="text"
                                    name="username"
                                    placeholder="Enter username"
                                    onChange={handleChange}
                                />
                                <button type="submit" disabled={!values.username}>
                                    Submit
                                </button>
                            </Form>
                        )}
                    </Formik>



                </div>
            )}
        </>
    );
}

export default AddFriendModal;
