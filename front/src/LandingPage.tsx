import { useEffect, useState } from "react";
import "./LandingPage.css";
import Typewriter from "typewriter-effect";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import axios from "axios";

// possibly use kbar?

type Course = {
    id: string;
    number: string;
};

type CoursesToPost = {
    courses: Course[];
    num_courses: number;
};

function LandingPage() {
    // button to go to get schedules!

    const [schedules, setSchedules] = useState([]);
    const [error, setError] = useState(null);
    const [coursesToPost, setCoursesToPost] = useState<CoursesToPost>({
        courses: [],
        num_courses: 0,
    });
    const { register, control, handleSubmit, reset, watch } = useForm({
        defaultValues: {
            courses: [{ id: "CS", number: "270" }],
            num_courses: NaN,
        },
    });

    const { fields, append, remove, swap, move, insert } = useFieldArray({
        control,
        name: "courses",
    });

    const onSubmit = (data: any) => {
        console.log("data", data);
        if (data.num_courses > data.courses.length) {
            alert("You have more courses to include than you have courses!");
            return;
        }
        if (data.num_courses < 1) {
            alert("You must include at least one course!");
            return;
        }
    };

    useEffect(() => {
        if (coursesToPost.courses.length === 0) {
            return;
        }
        axios
            .post("http://localhost:3000/api/courses/generateSchedules", {
                courses: coursesToPost,
                num_courses: coursesToPost.num_courses,
            })
            .then((res: any) => {
                setSchedules(res.data);
            })
            .catch((err: any) => {
                setError(err);
            });
    }, [coursesToPost]);

    const courseForm = (
        <form onSubmit={handleSubmit(onSubmit)}>
            <ul>
                {fields.map((item, index) => {
                    return (
                        <li key={item.id}>
                            <input
                                {...register(`courses.${index}.id` as const)}
                                defaultValue={item.id}
                            />
                            <input
                                {...register(
                                    `courses.${index}.number` as const
                                )}
                                defaultValue={item.number}
                            />
                            <button type="button" onClick={() => remove(index)}>
                                remove
                            </button>
                        </li>
                    );
                })}
                <li key="num_courses">
                    <input
                        {...register("num_courses" as const)}
                        placeholder="Courses # to include"
                        type="number"
                        value={watch("num_courses")}
                    />
                    <span>
                        {watch("num_courses") > fields.length
                            ? "You have more courses to include than you have courses!"
                            : "Number of courses to make the schedule with"}
                    </span>
                </li>
            </ul>
            <section>
                <button
                    type="button"
                    onClick={() => {
                        append({ id: "CS", number: "270" });
                    }}
                >
                    append
                </button>
                <button
                    type="button"
                    onClick={() =>
                        insert(2, {
                            id: "CS",
                            number: "270",
                        })
                    }
                >
                    insert at 2
                </button>

                {/* <button type="button" onClick={() => swap(1, 2)}>
                    swap
                </button>

                <button type="button" onClick={() => move(1, 2)}>
                    move
                </button>

                <button type="button" onClick={() => remove(1)}>
                    remove at
                </button> */}

                <button
                    type="button"
                    onClick={() =>
                        reset({
                            courses: [{ id: "CS", number: "270" }],
                            num_courses: NaN,
                        })
                    }
                >
                    reset
                </button>
            </section>

            <input type="submit" />
        </form>
    );

    return (
        <div className="LandingPage">
            <h1>
                <Typewriter
                    options={{
                        strings: ["Shaft Scheduler", "Check out our git repo!"],
                        autoStart: true,
                        loop: true,
                    }}
                />
            </h1>
            <div className="LandingPage__form">{courseForm}</div>
        </div>
    );
}

export default LandingPage;
