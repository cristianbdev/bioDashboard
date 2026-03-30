# Kobo response mapping (from example files only)

## Sources
- `kobo_asset_example.json` (instrument definition: `content.survey` + `content.choices`)
- `kobo_data_example.json` (submissions payload: `results[]`)

## High-level counts
- Submissions in data example: **25**
- Question rows parsed from survey (excluding group markers): **143**
- Distinct keys found in submissions: **156**
- Survey questions that appear at least once in submissions: **140/143**
- Survey questions not present in any submission key: **3**
- Metadata/system keys in submissions (not part of survey questions): **16**

## Mapping rule: instrument -> submission keys
The example files follow this direct mapping:
1. Every question in `content.survey` has an xpath (for example `Facility_General_Information/Market`).
2. The same xpath string is used as the key in each `results[n]` object inside `kobo_data_example.json`.
3. For selection questions, the stored value uses choice codes from `content.choices[].name` (not labels).
4. For `select_multiple`, multiple codes are stored in one string separated by spaces.

## Response format by question type (observed in examples)
| Type | How value appears in `results[]` | Example from data |
|---|---|---|
| `start` | ISO datetime string with timezone offset | `2025-07-04T14:33:17.175+02:00` |
| `end` | ISO datetime string with timezone offset | `2025-12-10T13:48:01.796+01:00` |
| `username` | Text username | `username not found` |
| `text` | Free text | `1- AST` |
| `geopoint` | String with latitude longitude altitude accuracy | `1.0849 -77.1243 2820.9 3` |
| `select_one` | Single choice code (\`choices.name\`) | `male` |
| `select_multiple` | One string with one or many choice codes separated by spaces | `owner` |

## Submission metadata/system keys (not survey questions)
| Key | Present in submissions | Non-empty in submissions | Example |
|---|---:|---:|---|
| `__version__` | 25/25 | 25/25 | `vd6Ew7wtoZBoygbuwmofv2` |
| `_attachments` | 25/25 | 0/25 | `` |
| `_geolocation` | 25/25 | 25/25 | `1.0849 -77.1243` |
| `_id` | 25/25 | 25/25 | `510591163` |
| `_notes` | 25/25 | 0/25 | `` |
| `_status` | 25/25 | 25/25 | `submitted_via_web` |
| `_submission_time` | 25/25 | 25/25 | `2025-07-04T13:27:06` |
| `_submitted_by` | 25/25 | 10/25 | `mafesdlc` |
| `_tags` | 25/25 | 0/25 | `` |
| `_uuid` | 25/25 | 25/25 | `be736fc5-c950-4e8f-8156-08fa0d13a035` |
| `_validation_status` | 25/25 | 25/25 | `{}` |
| `_xform_id_string` | 25/25 | 25/25 | `atWJrmvMK43Gtr6zny6vs7` |
| `formhub/uuid` | 25/25 | 25/25 | `49891293a3c8476fb79d24e79895cab3` |
| `meta/deprecatedID` | 11/25 | 11/25 | `uuid:02eca2ef-017b-4cb9-a770-a7ee23a83913` |
| `meta/instanceID` | 25/25 | 25/25 | `uuid:be736fc5-c950-4e8f-8156-08fa0d13a035` |
| `meta/rootUuid` | 25/25 | 25/25 | `uuid:552dd032-6a40-432f-8430-ffe35748326f` |

## Survey questions missing from all submission keys
| Key (xpath) | Type | Question | Group |
|---|---|---|---|
| `Facility_General_Information/Please_list_any_othe_in_previous_question` | `text` | Please list any other species cultured in the facility that are not mentioned in previous question | Facility General Information |
| `equipment/_10_10` | `select_one` | If yes, how are these treatments applied? | 10. Risk factors related to equiment, desinfection and mangement /Internal |
| `equipment/_10_12` | `select_one` | Does the facility use fresh feces from other animals as fertilizer for the ponds? | 10. Risk factors related to equiment, desinfection and mangement /Internal |

## Choice list dictionary summary (`content.choices`)
| list_name | Options count | Sample options (code=label) |
|---|---:|---|
| `af6qq39` | 4 | _less_than_2_years=Less than 2 years; _between_2_to_5_years=Between 2 to 5 years; _between_5_to_10_years=Between 5 to 10 years; _more_than_10_years=More than 10 years |
| `ar2hf54` | 6 | baths_with_salt=Baths with salt; vaccination=Vaccination; eggs_disinfection_with_iodine_solutions=Eggs disinfection; treatment_for_external_parasites=Treatment for external parasites; preventive_antibiotic_treatment=Preventive antibiotic treatment |
| `at2xq69` | 5 | less_than_one_year=Less than one year; one_year=One year; two_years=Two years; more_than_three_years=More than three years; no_records_available=No records available |
| `av4fc23` | 2 | yes=Yes; no=No |
| `ax6bh39` | 3 | yes=Yes; no=No; does_not_apply__no_veterinary_medication=Does not apply- No veterinary medicial products are used at the facility |
| `bg9ol66` | 6 | less_than_2_weeks=Less than 2 weeks; between_2_4_weeks=Between 2-4 weeks; between_1_3_months=Between 1-3 months; more_than_3_months=More than 3 months; prepared_and_used_on_the_same_day=Prepared and used on the same day |
| `bh3cw08` | 4 | 1_2=1-2; 3_4=3-4; 5_or_more=5 or more; none_in_12_months=No aquatic animals have been received at the facility in the past 12 months |
| `bm7sp30` | 4 | daily=Daily; once_a_week=Once a week; once_a_month=Once a month; periodically=Periodically |
| `bq61g90` | 7 | none_or_some_primary=None or some primary; primary_school=Primary school; secondary__high_school=Secondary/ high school; vocational_training=Vocational training; technical_college=Technical College |
| `bs5bc94` | 7 | eggs=Eggs; milt=Milt; spermatophores=Spermatophores; broodstock=Broodstock; larvae=Larvae |
| `by5ub69` | 3 | yes=Yes; no=No; does_not_apply__no_veterinary_medication=Does not apply- No veterinary medicial products are used at the facility |
| `cd2kh52` | 3 | yes=Yes; no=No; do_not_know=Do not know |
| `co7xn71` | 2 | yes=Yes; no=No |
| `cq1bf93` | 8 | in_the_presence_of_unexplained_mortality=In the presence of unexplained mortality or morbidity; after_the_arrival_of_new_fish_to_the_fac=After the arrival of new aquatic animals to the facility; before_sending_fish_to_another_site=Before sending aquatic animals to another facility; routinely__with_a_frequency_that_depends=Routinely, with a frequency that depends on the specific disease and the time of year; if_other_establishments_in_the_area_have=If other facilities in the area have the disease of interest |
| `dd8ls39` | 13 | temperature=Temperature; salinity=Salinity; ph=pH; carbon_dioxide=Carbon dioxide; oxygen=Oxygen |
| `de2bn19` | 2 | yes=Yes; no=No |
| `dk0ao84` | 3 | yes=Yes; no=No; does_not_have_water_supply_tank=Does not have water supply tank |
| `dl0ab82` | 11 | mortality__causes_and_disposal=Mortality and necropsy reports; health_status_for_new_animals_quarantine=Health status and laboratory test results; origin_of_animals=Origin of animals/ Genetic Material; stocking_densities__animals_per_cage_tan=Stocking densities/ Animals per cage/tank/pond; water_parameters=Water parameters |
| `du9st15` | 2 | yes=Yes; no=No |
| `el91f68` | 2 | yes=Yes; no=No |
| `em6dz73` | 3 | yes=Yes; no=No; does_not_apply_because_there_not_earth_p=Does not apply because there not earth ponds in the facility |
| `es9wr80` | 8 | _earthen_ponds=Earthen Ponds; _concrete_ponds=Concrete Ponds; _flow_through_tanks=Flow-through tanks; _aquaponics_thanks_raceways=Aquaponics thanks/raceways; _raceways=Raceways |
| `fe6zm57` | 2 | yes=Yes; no=No |
| `fn7td15` | 2 | yes=Yes; no=No |
| `fr4fi17` | 2 | yes=Yes; no=No |
| `fu4md19` | 2 | yes=Yes; no=No |
| `fx4lj88` | 7 | when_deaths_or_illnesses_last_longer_tha=When deaths or illnesses last longer than expected; when_a_listed_disease_is_suspected=When a listed disease is suspected; when_treatment_medication_doesn_t_help=When treatment/medication doesn't help; when_the_disease_is_unknown_or_unusual=When the disease is unknown or unusual; when_there_is_a_high_or_unusual_mortalit=When there is a high or unusual mortality |
| `gc8cb49` | 2 | yes=Yes; no=No |
| `ha2aq74` | 9 | mandatory_diseases=Officially listed diseases; welfare_and_normal_behavior_of_the_anima=Welfare and normal behavior of the animals; general_signs_of_disease_and_poor_welfar=General signs of disease; handling_aquatic_animals=Handling aquatic animals; humane_killing_of_aquatic_animals=Humane killing of aquatic animals |
| `hb77k13` | 2 | yes=Yes; no=No |
| `hc0ce50` | 4 | once_a_year=Once a year; once_every_two_years=Once every two years; once_every_three_years=Once every three years; never=Never |
| `ht51c79` | 2 | yes=Yes; no=No |
| `ic5uy70` | 2 | yes=Yes; no=No |
| `id1ex00` | 3 | at_least_once_a_day=At least once a day; at_least_once_a_week=At least once a week; never=Never |
| `ie9rw67` | 2 | yes=Yes; no=No |
| `ik6fj54` | 11 | transportation=Transportation; inadequate_acclimatization_of_new_fish_a=Inadequate acclimatization of new fish arriving on-site; handling_operations=Handling operations; overcrowding=Overcrowding; sudden_heavy_rainfall=Sudden heavy rainfall |
| `im9pz83` | 2 | yes=Yes; no=No |
| `in15x50` | 2 | yes=Yes; no=No |
| `in4tf73` | 2 | yes=Yes; no=No |
| `is1pv76` | 3 | never=Never; rarely=Rarely; often=Often |
| `iw4sl55` | 2 | yes=Yes; no=No |
| `jd4vb28` | 3 | yes=Yes; no=No; don_t_know=Don’t know |
| `je4te94` | 4 | bacterial_infections=Bacterial infections; viral_infections=Viral infections; parasitic_infections=Parasitic infections; fungal_infections=Fungal infections |
| `jn9vl72` | 3 | official_governmental_certification_or_p=Official/governmental authority; private_program_as_bp_or_iso=Private organization (e.g., BP or ISO); own_biosecurity_program_without_external=Internal team without external verification |
| `jq81w36` | 5 | protective_clothes=Use protective clothes; change_of_shoes=Change of shoes; footbath_with_disinfectant=Footbath with disinfectant; hand_disinfection=Hand Disinfection; none=None |
| `jx4ls31` | 2 | yes=Yes; no=No |
| `kh5vk82` | 2 | yes=Yes; no=No |
| `kl9oc64` | 2 | yes=Yes; no=No |
| `ks4sz02` | 2 | yes=Yes; no=No |
| `kt5ml86` | 4 | _on_land__ponds__dugouts__ras=On land; _water_bodies__rivers__lakes=Water bodies (rivers, lakes); _dam__reservoirs=Dam (reservoirs); _sea=Sea |
| `lh3id40` | 3 | own_vehicle=Own vehicle; feed_company_vehicle=Feed company vehicle; vehicles_from_other_establishments__near=Vehicles from other establishments (nearby establishments) |
| `lj6sy98` | 2 | yes=Yes; no=No |
| `ln3lq77` | 5 | never=Never; after_each_use=After each use; daily=Daily; weekly=Weekly; monthly=Monthly |
| `lp1vk49` | 7 | before_entering_the_facilities=Before entering the facilities; before_to_begin_the_daily_activities=Before to begin the daily activities; before_entering_each_production_area=Before entering each production area; after_handling_sick__moribund_or_dead_an=After handling sick, moribund or dead animals; after_handling_animals_in_the_quarantine=After handling animals in the quarantine zone |
| `lq5xe79` | 2 | yes=Yes; no=No |
| `lv8fg03` | 3 | mixed_yourself=Mixed yourself; supplied_medicated_feed=Supplied medicated feed; does_not_apply__no_antibiotics_are_used_=Does not apply- No antibiotics are used at the facility |
| `ma91w46` | 10 | oxytetracycline=Oxytetracycline; florfenicol=Florfenicol; sulfadiazine_trimethoprim=Sulfadiazine-trimethoprim; chlortetracycline=Chlortetracycline; amoxicillin=Amoxicillin |
| `mb5qr49` | 2 | yes=Yes; no=No |
| `mb7jb18` | 3 | yes=Yes; no=No; does_not_apply__no_veterinary_medicines_=Does not apply- No veterinary medicinal products are used at the facility |
| `md16e58` | 2 | yes=Yes; no=No |
| `mn5yy61` | 2 | yes=Yes; no=No |
| `mo4hl78` | 3 | yes=Yes; no=No; does_not_apply__no_veterinarian_medicine=Does not apply- No veterinary medicinal products are used at the facility |
| `mp6jn25` | 4 | yes__before_and_after_use=Yes, before and after use; yes__but_only_before_it_is_used=Yes, but only before it is used; yes__but_only_after_it_s_used=Yes, but only after it's used; no=No clean and disinfection of shared equipment |
| `mq6qj89` | 2 | yes=Yes; no=No |
| `mt7fn46` | 2 | yes=Yes; no=No |
| `mx5yt78` | 7 | feed_supplier=Feed supplier; chemical_drug_supplier=Chemical/drug supplier; university_student=University student; staff_on_the_establishment=Staff on the establishment; other_establishments=Other establishments |
| `mz1iq34` | 3 | yes=Yes; no=No; does_not_apply__no_antibiotics_are_used_=Does not apply- No antibiotics are used at the facility |
| `nb1lz65` | 2 | yes=Yes; no=No |
| `nn0mk71` | 4 | yes__before_and_after_use=Yes, before and after use; yes__but_only_before_it_is_used=Yes, but only before it is used; yes__but_only_after_it_s_used=Yes, but only after it's used; no=No |
| `no2ml14` | 2 | yes=Yes; no=No |
| `nw5xo17` | 6 | _hatchery=Hatchery; _broodstock=Broodstock; _frying=Frying; _grow_out=Grow-out; _whole_cycle=Whole Cycle |
| `ny73z87` | 3 | yes=Yes; no=No; does_not_apply_because_boxes_and_bags_ar=Does not apply because boxes and bags are no used for animal transportation |
| `of5tr62` | 5 | own_staff_of_the_establishmentoption_1=Own staff of the facility; officials_from_the_veterinary_authority=Officials from the competent Authority; private_vet=Private Vet; an_external_fish_health_expert=An external fish health expert; not_applicable_as_sample_collection_is_n=Not applicable as sample collection is never performed |
| `of67t35` | 2 | yes=Yes; no=No |
| `ol3pa15` | 8 | in_original_packaging=In original packaging with label; in_separated_containers_for_each_kind_of=In separated containers for each type of supplies (vaccine, feed, drugs); cool_and_dry=In cool and dry area; with_temperature_control__i_e__vaccines=In an appropriate temperature; inaccessible_to_pest=Inaccessible to pest |
| `on2zw06` | 5 | mechanical_filtration__sand_and_gravels=Mechanical filtration (sand and gravels); biological_filtration_biofilter=Biological filtration-Biofilter; ultraviolet__uv__light_treatment=Ultraviolet (UV) light treatment; ozone_treatment=Ozone treatment; chlorination=Chlorination |
| `or8kp59` | 2 | yes=Yes; no=No |
| `ov8fn08` | 2 | yes=Yes; no=No |
| `pa8fx90` | 9 | net_spoon=Net spoon; aerators=Aerators; feeding_container=Feeding container; feeding_equipment=Feeding equipment; siphon_pipes=Siphon pipes |
| `pd7pt22` | 2 | yes=Yes; no=No |
| `ph7zm27` | 3 | feeding_with_automatic_feeders=Feeding with automatic feeders; hand_feed=Hand feed; both=Both |
| `pn5fc37` | 3 | yes=Yes; no=No; does_not_apply__no_veterinary_medication=Does not apply- No veterinary medicial products are used at the facility |
| `pp5gi65` | 4 | at_least_once_a_day=When unusual mortality presented; at_least_twice_a_day=When clinical signs of disease present; at_least_once_a_week=At least once a week; never=Never |
| `ps9zt74` | 6 | never=Never; as_soon_as_possible__more_than_once_each=As soon as possible (More than once each day); daily=Daily; every_2_to_3_days=Every 2 to 3 days; once_a_week=Once a week |
| `pu5ig98` | 10 | gross_pathology__necropsy_and_observatio=Gross pathology (necropsy and observation of clinical sings); histopathology=Histopathology; water_quality_tests=Water quality tests; bacteriology=Bacteriology; parasitology=Parasitology |
| `pv4ax78` | 2 | yes=Yes; no=No |
| `qc4fl59` | 5 | daily__before_feeding=Daily (before feeding); at_least_once_a_week=At least once a week; at_least_once_a_month=At least once a month; only_when_necessary=Only when necessary; never=Never |
| `qk0sx12` | 3 | yes=Yes; no=No; does_not_apply_because_boxes_and_bags_ar=Does not apply because boxes and bags are no used for animal transportation |
| `qo4um46` | 2 | yes=Yes; no=No |
| `qr0gh52` | 2 | yes=Yes; no=No |
| `qu0fi02` | 2 | yes=Yes; no=No |
| `rd5mq59` | 7 | tilapia=Tilapia; catfish=Catfish; carp=Carp; salmon=Salmon; trout=Trout |
| `rz1fk46` | 7 | feed_quality=Feed quality; package_condition=Package condition; aspects_of_each_supply__colour__odour__s=Aspects of each supply (colour, odour, solubility, consistency; approved_by_veterinarian_authority=Approved by competent Authority; expiration_date=Expiration date |
| `rz8mf66` | 2 | yes=Yes; no=No |
| `sw43r42` | 8 | _larger_stores=Larger stores; _own_outlets=Own outlets; _middlemen=Middlemen; _wholesales=Wholesales; _restaurants__direct_sales=Restaurants (Direct sales) |
| `tl6dm15` | 3 | yes=Yes; no=No; does_not_apply_because_containers_are_no=Does not apply because containers are no used for animal transportation |
| `tm7ht02` | 6 | owner=Owner; manager=Manager; worker=Worker; veterinarian=Veterinarian; aquatic_animal_health_professional=Aquatic animal health professional |
| `ua03p19` | 8 | prevent_diseases=Prevent diseases; treat_sick_animals_and_reduce_the_mortal=Treat sick animals and reduce mortality rates without a confirmed diagnosis; eliminate_pathogenic_bacteria_in_water=Eliminate pathogenic bacteria in water and/or soil; improve_weigh_gain__growth_promoters=Improve weigh gain (growth promoters); treat_viral_infections=Treat Viral infections |
| `ud0ja56` | 2 | yes=Yes; no=No |
| `uf2sb57` | 4 | at_least_one_a_year=At least one a year; at_least_one_every_two_years=At least one every two years; at_least_one_every_three_years=At least one every three years; never=Never |
| `uj5bt13` | 2 | yes=Yes; no=No |
| `ul0yp60` | 2 | yes=Yes; no=No |
| `ul6pj84` | 5 | use_protective_clothes=Use protective clothes; change_of_shoes=Change of shoes; footbath_with_disinfectant=Footbath with disinfectant; hand_disinfection=Hand Disinfection; none=None |
| `uo5jn42` | 5 | _own_consumption=Own consumption; _local_market=Local market; _regional_market=Regional market; _national_market=National market; _export=Export |
| `uw6ll21` | 9 | it_is_buried=It is buried; it_is_incinerated=It is incinerated; it_is_discarded_in_water_body=It is discarded in water body; it_is_used_for_composting_or_silage=It is used for composting or silage; it_is_used_to_feed_other_fish_animals=It is used to feed other fish/animals |
| `uz2ad91` | 8 | in_a_designated_area=In a designated area; in_closed_containers=In closed containers; in_a_dry_area=In a dry area; in_an_adequate_temperature=In an appropriate temperature; inaccessible_to_pests=Inaccessible to pests |
| `vb7ow51` | 13 | mortality__management_and_disposal=Mortality (management and disposal); management_of_new_animals__quarantine=Management of new animals (quarantine); screening_of_water_quality=Screening of water quality and corrective actions when needed; biosecurity_measures_for_visitors__peopl=Biosecurity measures for visitors (people, vehicles and equipment); animal_health_program=Animal Health Program |
| `vc77b62` | 4 | female=Female; male=Male; gender_variant_non_conforming=Gender variant/non-conforming; prefer_not_answer=Prefer not answer |
| `vd2ka25` | 2 | yes=Yes; no=No |
| `vm3mj16` | 2 | yes=Yes; no=No |
| `vp1ek75` | 2 | yes=Yes; no=No |
| `vp4fg94` | 2 | yes=Yes; no=No |
| `vr6ev03` | 5 | at_least_once_a_day=At least once a day; at_least_twice_a_day=At least twice a day; at_least_once_a_week=At least once a week; at_least_twice_a_week=At least twice a week; never=Never |
| `wc1bt69` | 2 | yes=Yes; no=No |
| `wd0bn44` | 3 | in_feed=In feed; in_water=In water; in_the_surroindings=In the surroindings |
| `we0av50` | 2 | yes=Yes; no=No |
| `wl6rm68` | 3 | at_least_once_a_day=At least once a day; at_least_once_a_week=At least once a week; never=Never |
| `wm4eu20` | 2 | yes=Yes; no=No |
| `wr16p54` | 2 | yes=Yes; no=No |
| `wx1so56` | 4 | never=Daily; daily=Weekly; weekly=Monthly; monthly=Less thank once a month |
| `wx3jj83` | 2 | yes=Yes; no=No |
| `wy5yq50` | 7 | at_least_once_a_month=At least once a month; at_least_every_3_months=At least every 3 months; at_least_every_6_months=At least every 6 months; yearly=Yearly; once_every_production_cycle=Once every production cycle |
| `xd5om51` | 7 | lake=Lake; river=River; dam=Dam; sea=Sea; underground_water=Underground water |
| `xy9vq76` | 2 | yes=Yes; no=No |
| `yd5bp51` | 5 | mechanical_filtration=Mechanical filtration (sand and gravels); biological_filtration=Biological filtration; ultraviolet__uv__light_treatment=Ultraviolet (UV) light treatment; ozone_treatment=Ozone treatment; chlorination=Chlorination |
| `yg3dy83` | 5 | digital__excel=Digital- Excel; digital__app_or_private_system=Digital- App or private system; notebooks=Notebooks; preprinted_form=Preprinted form; the_establishment_does_not_have_records_=The facility does not have records of routine practices |
| `yn6fi90` | 7 | commercial_feed=Commercial feed; homemade_feed=Farm-made feed; food_scraps=Food scraps; raw_or_live_feed=Raw or live feed; mix_of_commercial_and_homemade_food=Mix of commercial and Farm-made food |
| `yr0ns11` | 2 | yes=Yes; no=No |
| `yw1si60` | 9 | antibiotics=Antibiotics; antifungals=Antifungals; antiparasitics=Antiparasitics; anesthetic=Anesthetic; vaccines=Vaccines |
| `yz1fy11` | 2 | yes=Yes; no=No |
| `ze1dg74` | 5 | buried_in_the_ground=Buried in the ground; discarded_without_being_buried=Collection for final disposal outside the facility; siled_with_acids=Siled with acids; used_to_feed_other_fish_animals=Used to feed other fish/animals; released_to_water_source=Released to water source |
| `zg4vr86` | 6 | temperature=Temperature; humidity_level=Humidity level; lightning_conditions=Lightning conditions; damage_to_containers=Damage to containers; pet__vector_signs=Pet/ Vector Signs |
| `zu8vy84` | 2 | yes=Yes; no=No |
